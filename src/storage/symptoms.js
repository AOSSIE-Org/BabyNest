import {openDB} from '../database';
import {success, failure} from '../utils/serviceResponse';
import {clearAgentContext} from './agent';

// Create
export async function addSymptom(userId, data) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const week = data?.week_number;
    const symptom = data?.symptom;
    const note = data?.note ?? null;

    if (week === undefined || week === null || !symptom) {
      return failure('week_number and symptom are required', 'MISSING_FIELDS');
    }

    const db = await openDB();

    // Make sure the user exists
    const profileResult = await db.execute(
      'SELECT id FROM profile WHERE id = ?',
      [parsedUserId],
    );

    if (!profileResult.rows?._array?.length) {
      return failure('User profile not found', 'USER_NOT_FOUND');
    }

    const result = await db.execute(
      `INSERT INTO weekly_symptoms (
        week_number,
        symptom,
        note,
        user_id
      )
      VALUES (?, ?, ?, ?)`,
      [week, symptom, note, parsedUserId],
    );

    // SQLite changed → invalidate context cache
    clearAgentContext(parsedUserId);

    return success({
      id: result.insertId,
      message: 'Symptom added',
    });
  } catch (error) {
    console.error('addSymptom error:', error);

    return failure('Failed to add symptom', 'ADD_SYMPTOM_ERROR');
  }
}

// Read all
export async function getAllSymptoms(userId) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM weekly_symptoms
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getAllSymptoms error:', error);

    return failure('Failed to get symptoms', 'GET_SYMPTOMS_ERROR');
  }
}

// Read by week (||)
export async function getWeekSymptoms(userId, week) {
  try {
    const parsedUserId = Number(userId);
    const parsedWeek = Number(week);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedWeek)) {
      return failure('week must be a valid integer', 'INVALID_WEEK');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM weekly_symptoms
       WHERE week_number = ?
         AND user_id = ?
       ORDER BY created_at DESC`,
      [parsedWeek, parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getWeekSymptoms error:', error);

    return failure(
      'Failed to get symptoms for week',
      'GET_SYMPTOMS_WEEK_ERROR',
    );
  }
}

// Read by ID (||)
export async function getSymptom(userId, id) {
  try {
    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM weekly_symptoms
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const symptom = result.rows?._array?.[0];

    if (!symptom) {
      return failure('Symptom entry not found', 'SYMPTOM_NOT_FOUND');
    }

    return success(symptom);
  } catch (error) {
    console.error('getSymptom error:', error);

    return failure('Failed to get symptom', 'GET_SYMPTOM_ERROR');
  }
}

// Update
export async function updateSymptom(userId, id, data) {
  try {
    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_ID');
    }

    const db = await openDB();

    // Only get this user's symptom
    const existingResult = await db.execute(
      `SELECT *
       FROM weekly_symptoms
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const symptomEntry = existingResult.rows?._array?.[0];

    if (!symptomEntry) {
      return failure('Symptom entry not found', 'SYMPTOM_NOT_FOUND');
    }

    await db.execute(
      `UPDATE weekly_symptoms
       SET week_number = ?,
           symptom = ?,
           note = ?
       WHERE id = ?
         AND user_id = ?`,
      [
        data?.week_number ?? symptomEntry.week_number,
        data?.symptom ?? symptomEntry.symptom,
        data?.note ?? symptomEntry.note,
        parsedId,
        parsedUserId,
      ],
    );

    // SQLite changed → invalidate context cache
    clearAgentContext(parsedUserId);

    return success({
      message: 'Symptom updated',
    });
  } catch (error) {
    console.error('updateSymptom error:', error);

    return failure('Failed to update symptom', 'UPDATE_SYMPTOM_ERROR');
  }
}

// Delete
export async function deleteSymptom(userId, id) {
  try {
    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_ID');
    }

    const db = await openDB();

    // Check that this symptom belongs to this user
    const existingResult = await db.execute(
      `SELECT id
       FROM weekly_symptoms
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const symptomEntry = existingResult.rows?._array?.[0];

    if (!symptomEntry) {
      return failure('Symptom entry not found', 'SYMPTOM_NOT_FOUND');
    }

    await db.execute(
      `DELETE FROM weekly_symptoms
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    // SQLite changed → invalidate context cache
    clearAgentContext(parsedUserId);

    return success({
      message: 'Symptom deleted',
    });
  } catch (error) {
    console.error('deleteSymptom error:', error);

    return failure('Failed to delete symptom', 'DELETE_SYMPTOM_ERROR');
  }
}
