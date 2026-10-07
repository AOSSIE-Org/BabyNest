import {open} from 'react-native-nitro-sqlite';
import {SCHEMA} from './schema';

const DATABASE_NAME = 'babynest.db';

let db = null;
let initializationPromise = null;

async function initializeDatabase() {
  let connection;

  try {
    connection = open({name: DATABASE_NAME});

    const result = await connection.execute('PRAGMA user_version;');
    const version = result.rows?._array?.[0]?.user_version ?? 0;

    if (version === 0) {
      console.log('VERSION IS 0 → STARTING SCHEMA');

      // Roll back schema, seed data and version together if setup fails.
      await connection.transaction(async transaction => {
        for (let i = 0; i < SCHEMA.length; i++) {
          console.log(`Executing schema ${i}`);

          try {
            await transaction.execute(SCHEMA[i]);
            console.log(`Schema ${i} SUCCESS`);
          } catch (error) {
            console.error(`Schema ${i} FAILED`);
            console.error('SQL:', SCHEMA[i]);
            console.error('ERROR:', error);
            throw error;
          }
        }

        console.log('SCHEMA FINISHED');
        await transaction.execute('PRAGMA user_version = 1;');
      });
      console.log('VERSION SET TO 1');
    }

    // Publish only after initialization and its transaction have completed.
    db = connection;
    return db;
  } catch (error) {
    if (connection) {
      try {
        connection.close();
      } catch (closeError) {
        console.error(
          'Failed to close database after initialization error:',
          closeError,
        );
      }
    }
    throw error;
  }
}

export async function openDB() {
  if (db) {
    return db;
  }

  if (!initializationPromise) {
    initializationPromise = initializeDatabase().finally(() => {
      initializationPromise = null;
    });
  }

  return initializationPromise;
}
