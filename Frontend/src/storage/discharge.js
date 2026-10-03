import { openDB } from '../database';
import { success, failure } from '../utils/serviceResponse';
import { clearAgentContext } from './agent';

// Create
export async function addDischargeLog(userId, data) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

      const required = ['week_number', 'type', 'color', 'bleeding'];

    const missing = required.filter(
      field => data?.[field] === undefined || data?.[field] === null,
    );

    if (missing.length > 0) {
      return failure(
        `Missing required fields: ${missing.join(', ')}`,
        'MISSING_FIELDS',
      );
    }
    if (data.week_number > 40) {
      return failure("Please enter a valid week number", "INVALID_FEILDS");
    }

    const db = await openDB();

    // Make sure the user/profile exists
    const profile = await db.execute('SELECT id FROM profile WHERE id = ?', [
      parsedUserId,
    ]);

    if (!profile.rows?._array?.length) {
      return failure('User profile not found', 'USER_NOT_FOUND');
    }

    const result = await db.execute(
      `INSERT INTO discharge_logs (
        week_number,
        type,
        color,
        bleeding,
        note,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.week_number,
        data.type,
        data.color,
        data.bleeding,
        data.note ?? null,
        parsedUserId,
      ],
    );

    // Data changed → invalidate cached context
    clearAgentContext(parsedUserId);

    return success({
      id: result.insertId,
      message: 'Discharge entry added',
    });
  } catch (error) {
    console.error('addDischargeLog error:', error);

    return failure('Failed to add discharge entry', 'ADD_DISCHARGE_ERROR');
  }
}

// Read all
export async function getDischargeLogs(userId) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM discharge_logs
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getDischargeLogs error:', error);

    return failure('Failed to get discharge logs', 'GET_DISCHARGE_ERROR');
  }
}

// Read by week (||)
export async function getDischargeLogsByWeek(userId, week) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

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
       FROM discharge_logs
       WHERE week_number = ?
         AND user_id = ?
       ORDER BY created_at DESC`,
      [parsedWeek, parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getDischargeLogsByWeek error:', error);

    return failure(
      'Failed to get discharge logs for week',
      'GET_DISCHARGE_WEEK_ERROR',
    );
  }
}

// Read by ID (||)
export async function getDischargeLog(userId, id) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

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
       FROM discharge_logs
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const entry = result.rows?._array?.[0];

    if (!entry) {
      return failure('Discharge entry not found', 'DISCHARGE_NOT_FOUND');
    }

    return success(entry);
  } catch (error) {
    console.error('getDischargeLog error:', error);

    return failure(
      'Failed to get discharge entry',
      'GET_DISCHARGE_BY_ID_ERROR',
    );
  }
}

// Update
export async function updateDischargeLog(userId, id, data) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_ID');
    }
     
    if (data.week_number > 40) {
      return failure("Please enter a valid week number", "INVALID_FEILDS");
    }

    const db = await openDB();

    // Find only this user's entry
    const existingResult = await db.execute(
      `SELECT *
       FROM discharge_logs
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const entry = existingResult.rows?._array?.[0];

    if (!entry) {
      return failure('Discharge entry not found', 'DISCHARGE_NOT_FOUND');
    }

    await db.execute(
      `UPDATE discharge_logs
       SET week_number = ?,
           type = ?,
           color = ?,
           bleeding = ?,
           note = ?
       WHERE id = ?
         AND user_id = ?`,
      [
        data?.week_number ?? entry.week_number,
        data?.type ?? entry.type,
        data?.color ?? entry.color,
        data?.bleeding ?? entry.bleeding,
        data?.note ?? entry.note,
        parsedId,
        parsedUserId,
      ],
    );

    // Data changed → invalidate cached context
    clearAgentContext(parsedUserId);

    return success({
      message: 'Entry updated',
    });
  } catch (error) {
    console.error('updateDischargeLog error:', error);

    return failure(
      'Failed to update discharge entry',
      'UPDATE_DISCHARGE_ERROR',
    );
  }
}

// Delete
export async function deleteDischargeLog(userId, id) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_ID');
    }

    const db = await openDB();

    // Make sure this entry belongs to this user
    const existingResult = await db.execute(
      `SELECT id
       FROM discharge_logs
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const entry = existingResult.rows?._array?.[0];

    if (!entry) {
      return failure('Discharge entry not found', 'DISCHARGE_NOT_FOUND');
    }

    await db.execute(
      `DELETE FROM discharge_logs
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    // Data changed → invalidate cached context
    clearAgentContext(parsedUserId);

    return success({
      message: 'Entry deleted',
    });
  } catch (error) {
    console.error('deleteDischargeLog error:', error);

    return failure(
      'Failed to delete discharge entry',
      'DELETE_DISCHARGE_ERROR',
    );
  }
}
