jest.mock('react-native-nitro-sqlite', () => ({open: jest.fn()}));

// Include a non-idempotent seed followed by another schema statement so that a
// late failure can expose partial initialization and duplicate seeds on retry.
jest.mock('../src/database/schema', () => ({
  SCHEMA: [
    'CREATE TABLE IF NOT EXISTS tasks (title TEXT);',
    "INSERT INTO tasks (title) VALUES ('Initial visit');",
    'CREATE TABLE IF NOT EXISTS appointments (title TEXT);',
  ],
}));

const {SCHEMA} = require('../src/database/schema');
const READ_VERSION = 'PRAGMA user_version;';
const WRITE_VERSION = 'PRAGMA user_version = 1;';

function deferred() {
  let resolve;
  const promise = new Promise(resolvePromise => {
    resolve = resolvePromise;
  });
  return {promise, resolve};
}

function queryResult(rows = []) {
  return {
    rowsAffected: 0,
    rows: {_array: rows, length: rows.length, item: index => rows[index]},
  };
}

// Nitro SQLite 9.1.11 has synchronous open/execute/close and tx.execute methods.
// Only transaction(callback) returns a promise. Model its awaited callback,
// commit, and rollback without making the normal query mocks asynchronous.
function createConnection({
  disk = {version: 0, seeds: 0},
  failAt,
  error = new Error('database initialization failed'),
  onExecute = () => {},
  beforeCommit = () => {},
  closeError,
} = {}) {
  const queries = [];
  const executeQuery = (state, sql) => {
    queries.push(sql);
    onExecute(sql);

    if (
      (failAt === 'read' && sql === READ_VERSION) ||
      (failAt === 'schema' && sql === SCHEMA[2]) ||
      (failAt === 'write' && sql === WRITE_VERSION)
    ) {
      throw error;
    }

    if (sql === READ_VERSION) {
      return queryResult([{user_version: state.version}]);
    }
    if (sql === SCHEMA[1]) {
      state.seeds += 1;
    }
    if (sql === WRITE_VERSION) {
      state.version = 1;
    }
    return queryResult();
  };

  const tx = {
    execute: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(() => queryResult()),
  };
  const connection = {
    execute: jest.fn(sql => executeQuery(disk, sql)),
    close: jest.fn(() => {
      if (closeError) {
        throw closeError;
      }
    }),
    transaction: jest.fn(async callback => {
      const pending = {...disk};
      tx.execute.mockImplementation(sql => executeQuery(pending, sql));
      tx.commit.mockImplementation(() => {
        if (failAt === 'commit') {
          throw error;
        }
        Object.assign(disk, pending);
        return queryResult();
      });

      try {
        // The native wrapper queues BEGIN before invoking the callback.
        await Promise.resolve();
        await callback(tx);
        await beforeCommit();
        tx.commit();
      } catch (transactionError) {
        tx.rollback();
        throw transactionError;
      }
    }),
  };

  return {connection, tx, disk, queries};
}

function loadDatabase() {
  return {
    openDB: require('../src/database').openDB,
    open: require('react-native-nitro-sqlite').open,
  };
}

// Drain several promise continuations without timers or wall-clock sleeps.
async function flushMicrotasks() {
  for (let index = 0; index < 12; index++) {
    await Promise.resolve();
  }
}

describe('openDB initialization', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes once and reuses the fully initialized connection', async () => {
    const {openDB, open} = loadDatabase();
    const {connection, tx, disk, queries} = createConnection();
    open.mockReturnValue(connection);

    const connections = await Promise.all([openDB(), openDB(), openDB()]);

    expect(connections).toEqual([connection, connection, connection]);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith({name: 'babynest.db'});
    expect(connection.execute).toHaveBeenCalledTimes(1);
    expect(connection.execute).toHaveBeenCalledWith(READ_VERSION);
    expect(connection.transaction).toHaveBeenCalledTimes(1);
    expect(tx.execute.mock.calls).toEqual([
      ...SCHEMA.map(sql => [sql]),
      [WRITE_VERSION],
    ]);
    expect(queries).toEqual([READ_VERSION, ...SCHEMA, WRITE_VERSION]);
    expect(tx.commit).toHaveBeenCalledTimes(1);
    expect(tx.rollback).not.toHaveBeenCalled();
    expect(connection.close).not.toHaveBeenCalled();
    expect(disk).toEqual({version: 1, seeds: 1});

    await expect(openDB()).resolves.toBe(connection);
    expect(open).toHaveBeenCalledTimes(1);
    expect(queries).toEqual([READ_VERSION, ...SCHEMA, WRITE_VERSION]);
    expect(connection.transaction).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['reading the version', READ_VERSION],
    ['creating the first table', SCHEMA[0]],
    ['inserting seed data', SCHEMA[1]],
    ['writing the version', WRITE_VERSION],
  ])('keeps callers waiting while %s', async (_stage, checkpoint) => {
    const {openDB, open} = loadDatabase();
    const disk = {version: 0, seeds: 0};
    const observations = [];
    let concurrentCall;
    const {connection, tx} = createConnection({
      disk,
      onExecute: sql => {
        if (sql === checkpoint) {
          // This query still returns synchronously, like the real native API.
          // Schedule a caller at the next await boundary, without pretending
          // another JS caller can interrupt synchronous native execution.
          Promise.resolve().then(() => {
            concurrentCall = openDB().then(value => {
              observations.push({
                ...disk,
                commits: tx.commit.mock.calls.length,
              });
              return value;
            });
          });
        }
      },
    });
    open.mockReturnValue(connection);

    await expect(openDB()).resolves.toBe(connection);
    expect(concurrentCall).toBeDefined();
    await expect(concurrentCall).resolves.toBe(connection);
    expect(observations).toEqual([{version: 1, seeds: 1, commits: 1}]);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('does not publish a connection before its transaction has committed', async () => {
    const {openDB, open} = loadDatabase();
    const commitGate = deferred();
    const commitReached = deferred();
    const {connection, tx, disk} = createConnection({
      beforeCommit: () => {
        commitReached.resolve();
        return commitGate.promise;
      },
    });
    open.mockReturnValue(connection);
    const settled = [];
    const first = openDB().then(value => {
      settled.push('first');
      return value;
    });
    const second = openDB().then(value => {
      settled.push('second');
      return value;
    });

    // Do not await commitReached indefinitely if a regression omits the
    // transaction altogether: fail on the contract assertion instead.
    await flushMicrotasks();
    try {
      expect(connection.transaction).toHaveBeenCalledTimes(1);
      await commitReached.promise;
      const third = openDB().then(value => {
        settled.push('third');
        return value;
      });
      await flushMicrotasks();
      expect(settled).toEqual([]);
      expect(disk).toEqual({version: 0, seeds: 0});
      expect(tx.commit).not.toHaveBeenCalled();
      commitGate.resolve();
      await expect(Promise.all([first, second, third])).resolves.toEqual([
        connection,
        connection,
        connection,
      ]);
      expect(tx.commit).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledTimes(1);
    } finally {
      commitGate.resolve();
      await Promise.allSettled([first, second]);
    }
  });

  it.each([1, 7])(
    'skips schema work for existing version %s',
    async version => {
      const {openDB, open} = loadDatabase();
      const {connection, queries} = createConnection({
        disk: {version, seeds: 5},
      });
      open.mockReturnValue(connection);

      await expect(Promise.all([openDB(), openDB()])).resolves.toEqual([
        connection,
        connection,
      ]);
      await expect(openDB()).resolves.toBe(connection);
      expect(queries).toEqual([READ_VERSION]);
      expect(connection.transaction).not.toHaveBeenCalled();
      expect(connection.close).not.toHaveBeenCalled();
      expect(open).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['open', 'read', 'schema', 'write', 'commit'])(
    'shares a %s failure with all callers and allows a clean retry',
    async failAt => {
      const {openDB, open} = loadDatabase();
      const error = new Error(`${failAt} failed`);
      const failed = createConnection({failAt, error});
      const retry = createConnection();
      open.mockImplementationOnce(() => {
        if (failAt === 'open') {
          throw error;
        }
        return failed.connection;
      });
      open.mockReturnValue(retry.connection);

      const outcomes = await Promise.allSettled([openDB(), openDB(), openDB()]);

      for (const outcome of outcomes) {
        expect(outcome.status).toBe('rejected');
        expect(outcome.reason).toBe(error);
      }
      expect(open).toHaveBeenCalledTimes(1);
      expect(failed.connection.close).toHaveBeenCalledTimes(
        failAt === 'open' ? 0 : 1,
      );
      if (['schema', 'write', 'commit'].includes(failAt)) {
        expect(failed.tx.rollback).toHaveBeenCalledTimes(1);
      }
      if (failAt === 'schema') {
        expect(failed.queries).not.toContain(WRITE_VERSION);
      }

      await expect(Promise.all([openDB(), openDB()])).resolves.toEqual([
        retry.connection,
        retry.connection,
      ]);
      expect(open).toHaveBeenCalledTimes(2);
      expect(retry.connection.transaction).toHaveBeenCalledTimes(1);
      expect(retry.connection.close).not.toHaveBeenCalled();
      await expect(openDB()).resolves.toBe(retry.connection);
      expect(open).toHaveBeenCalledTimes(2);
    },
  );

  it('preserves the initialization error if closing the connection also throws', async () => {
    const {openDB, open} = loadDatabase();
    const error = new Error('schema failed');
    const failed = createConnection({
      failAt: 'schema',
      error,
      closeError: new Error('close failed'),
    });
    const retry = createConnection();
    open
      .mockReturnValueOnce(failed.connection)
      .mockReturnValue(retry.connection);

    await expect(openDB()).rejects.toBe(error);
    expect(failed.connection.close).toHaveBeenCalledTimes(1);
    await expect(openDB()).resolves.toBe(retry.connection);
    expect(open).toHaveBeenCalledTimes(2);
  });

  it.each(['schema', 'write', 'commit'])(
    'rolls back partial setup after a %s failure so retry cannot duplicate seeds',
    async failAt => {
      const {openDB, open} = loadDatabase();
      const disk = {version: 0, seeds: 0};
      const error = new Error(`${failAt} failed`);
      const failed = createConnection({disk, failAt, error});
      const retry = createConnection({disk});
      open
        .mockReturnValueOnce(failed.connection)
        .mockReturnValue(retry.connection);

      await expect(openDB()).rejects.toBe(error);
      expect(failed.queries).toContain(SCHEMA[1]);
      expect(failed.tx.rollback).toHaveBeenCalledTimes(1);
      expect(disk).toEqual({version: 0, seeds: 0});

      await expect(openDB()).resolves.toBe(retry.connection);
      expect(disk).toEqual({version: 1, seeds: 1});
      expect(retry.tx.commit).toHaveBeenCalledTimes(1);
      await expect(openDB()).resolves.toBe(retry.connection);
      expect(disk.seeds).toBe(1);
      expect(open).toHaveBeenCalledTimes(2);
    },
  );
});
