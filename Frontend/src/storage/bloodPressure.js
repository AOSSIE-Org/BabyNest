import {openDB} from '../database';
import {success, failure} from '../utils/serviceResponse';

/**
 * Add blood pressure log
 */
export async function addBPLog(userId, data) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!data) {
      return failure('No data provided', 'NO_DATA');
    }

    const required = ['week_number', 'systolic', 'diastolic', 'time'];

    const missing = required.filter(
      field => data[field] === undefined || data[field] === null,
    );

    if (missing.length > 0) {
      return failure(
        `Missing required fields: ${missing.join(', ')}`,
        'MISSING_FIELDS',
      );
    }

    const weekNumber = Number(data.week_number);
    const systolic = Number(data.systolic);
    const diastolic = Number(data.diastolic);

    // Basic validation
    if (!Number.isInteger(weekNumber)) {
      return failure(
        'week_number must be a valid integer',
        'INVALID_WEEK_NUMBER',
      );
    }

    if (!Number.isFinite(systolic)) {
      return failure('systolic must be a valid number', 'INVALID_SYSTOLIC');
    }

    if (!Number.isFinite(diastolic)) {
      return failure('diastolic must be a valid number', 'INVALID_DIASTOLIC');
    }

    const db = await openDB();

    // Make sure the user exists
    const userResult = await db.execute('SELECT 1 FROM profile WHERE id = ?', [
      parsedUserId,
    ]);

    const userExists = userResult.rows?._array?.[0];

    if (!userExists) {
      return failure('User profile not found', 'USER_PROFILE_NOT_FOUND');
    }

    await db.execute(
      `
      INSERT INTO blood_pressure_logs (
        week_number,
        systolic,
        diastolic,
        time,
        note,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        weekNumber,
        systolic,
        diastolic,
        data.time,
        data.note ?? null,
        parsedUserId,
      ],
    );

    return success({
      status: 'success',
      message: 'Blood pressure entry added',
    });
  } catch (error) {
    console.error('addBPLog error:', error);

    return failure('Failed to add blood pressure entry', 'BP_ADD_ERROR');
  }
}

/**
 * Get all blood pressure logs for a user
 */
export async function getBPLogs(userId) {
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
      `
      SELECT *
      FROM blood_pressure_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [parsedUserId],
    );

    const logs = result.rows?._array ?? [];

    return success(logs);
  } catch (error) {
    console.error('getBPLogs error:', error);

    return failure('Failed to fetch blood pressure logs', 'BP_FETCH_ERROR');
  }
}

/**
 * Get blood pressure logs for a specific week
 */
export async function getBPLogsByWeek(userId, week) {
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
      `
      SELECT *
      FROM blood_pressure_logs
      WHERE user_id = ?
        AND week_number = ?
      ORDER BY created_at DESC
      `,
      [parsedUserId, parsedWeek],
    );

    const logs = result.rows?._array ?? [];

    return success(logs);
  } catch (error) {
    console.error('getBPLogsByWeek error:', error);

    return failure(
      'Failed to fetch blood pressure logs',
      'BP_WEEK_FETCH_ERROR',
    );
  }
}

/**
 * Get one blood pressure log
 */
export async function getBPLog(userId, id) {
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
      return failure('id must be a valid integer', 'INVALID_BP_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `
      SELECT *
      FROM blood_pressure_logs
      WHERE id = ?
        AND user_id = ?
      `,
      [parsedId, parsedUserId],
    );

    const entry = result.rows?._array?.[0];

    if (!entry) {
      return failure('Blood pressure entry not found', 'BP_NOT_FOUND');
    }

    return success(entry);
  } catch (error) {
    console.error('getBPLog error:', error);

    return failure(
      'Failed to fetch blood pressure entry',
      'BP_SINGLE_FETCH_ERROR',
    );
  }
}

/**
 * Update blood pressure log
 */
export async function updateBPLog(userId, id, data) {
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
      return failure('id must be a valid integer', 'INVALID_BP_ID');
    }

    if (!data) {
      return failure('No data provided', 'NO_DATA');
    }

    const db = await openDB();

    // IMPORTANT:
    // Find the entry only if it belongs to this user
    const result = await db.execute(
      `
      SELECT *
      FROM blood_pressure_logs
      WHERE id = ?
        AND user_id = ?
      `,
      [parsedId, parsedUserId],
    );

    const entry = result.rows?._array?.[0];

    if (!entry) {
      return failure('Blood pressure entry not found', 'BP_NOT_FOUND');
    }

    const weekNumber = data.week_number ?? entry.week_number;

    const systolic = data.systolic ?? entry.systolic;

    const diastolic = data.diastolic ?? entry.diastolic;

    const time = data.time ?? entry.time;

    const note = data.note ?? entry.note;

    // Validate updated values
    if (!Number.isInteger(Number(weekNumber))) {
      return failure(
        'week_number must be a valid integer',
        'INVALID_WEEK_NUMBER',
      );
    }

    if (!Number.isFinite(Number(systolic))) {
      return failure('systolic must be a valid number', 'INVALID_SYSTOLIC');
    }

    if (!Number.isFinite(Number(diastolic))) {
      return failure('diastolic must be a valid number', 'INVALID_DIASTOLIC');
    }

    await db.execute(
      `
      UPDATE blood_pressure_logs
      SET
        week_number = ?,
        systolic = ?,
        diastolic = ?,
        time = ?,
        note = ?
      WHERE id = ?
        AND user_id = ?
      `,
      [
        Number(weekNumber),
        Number(systolic),
        Number(diastolic),
        time,
        note,
        parsedId,
        parsedUserId,
      ],
    );

    return success({
      status: 'success',
      message: 'Entry updated',
    });
  } catch (error) {
    console.error('updateBPLog error:', error);

    return failure('Failed to update blood pressure entry', 'BP_UPDATE_ERROR');
  }
}

/**
 * Delete blood pressure log
 */
export async function deleteBPLog(userId, id) {
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
      return failure('id must be a valid integer', 'INVALID_BP_ID');
    }

    const db = await openDB();

    // Only delete if this entry belongs to this user
    const result = await db.execute(
      `
      DELETE FROM blood_pressure_logs
      WHERE id = ?
        AND user_id = ?
      `,
      [parsedId, parsedUserId],
    );

    // Check whether anything was actually deleted
    if (result.rowsAffected === 0) {
      return failure('Blood pressure entry not found', 'BP_NOT_FOUND');
    }

    return success({
      status: 'success',
      message: 'Entry deleted',
    });
  } catch (error) {
    console.error('deleteBPLog error:', error);

    return failure('Failed to delete blood pressure entry', 'BP_DELETE_ERROR');
  }
}
