import {open} from 'react-native-nitro-sqlite';
import {SCHEMA} from './schema';

const DATABASE_NAME = 'babynest.db';

let db = null;

export async function openDB() {
  // If already opened, return the same connection
  if (db) {
    return db;
  }

  // Open existing database or create a new one
  db = open({name: DATABASE_NAME});

  // Check whether database initialization has already happened
  const result = await db.execute(`PRAGMA user_version;`);

  const version = result.rows?._array?.[0]?.user_version ?? 0;

  // First-time database setup
  if (version === 0) {
    console.log('VERSION IS 0 → STARTING SCHEMA');

    for (let i = 0; i < SCHEMA.length; i++) {
      console.log(`Executing schema ${i}`);

      try {
        await db.execute(SCHEMA[i]);
        console.log(`Schema ${i} SUCCESS`);
      } catch (error) {
        console.error(`Schema ${i} FAILED`);
        console.error('SQL:', SCHEMA[i]);
        console.error('ERROR:', error);
        throw error;
      }
    }

    console.log('SCHEMA FINISHED');
    await db.execute(`PRAGMA user_version = 1;`);
    console.log('VERSION SET TO 1');
  }

  return db;
}
