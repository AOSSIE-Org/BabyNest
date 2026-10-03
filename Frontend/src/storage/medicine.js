import {openDB} from '../database';
import {success, failure} from '../utils/serviceResponse';
import {clearAgentContext} from './agent';

// Create
export async function addMedicine(userId, data) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const required = ['week_number', 'name', 'dose', 'time'];

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
      return failure('Please enter a valid week number', 'INVALID_FEILDS');
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
      `INSERT INTO weekly_medicine (
        week_number,
        name,
        dose,
        time,
        note,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.week_number,
        data.name,
        data.dose,
        data.time,
        data.note ?? null,
        parsedUserId,
      ],
    );

    clearAgentContext(parsedUserId);

    return success({
      id: result.insertId,
      message: 'Medicine added',
    });
  } catch (error) {
    console.error('addMedicine error:', error);

    return failure('Failed to add medicine', 'ADD_MEDICINE_ERROR');
  }
}

// Read all medicine for user
export async function getAllMedicine(userId) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM weekly_medicine
       WHERE user_id = ?
       ORDER BY week_number ASC`,
      [parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getAllMedicine error:', error);

    return failure('Failed to get medicine records', 'GET_MEDICINE_ERROR');
  }
}

// Read medicine by week (||)
export async function getWeekMedicine(userId, week) {
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
       FROM weekly_medicine
       WHERE week_number = ?
         AND user_id = ?
       ORDER BY id DESC`,
      [parsedWeek, parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getWeekMedicine error:', error);

    return failure(
      'Failed to get medicine for week',
      'GET_MEDICINE_WEEK_ERROR',
    );
  }
}

// Read medicine by ID (||)
export async function getMedicine(userId, id) {
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
       FROM weekly_medicine
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const entry = result.rows?._array?.[0];

    if (!entry) {
      return failure('Medicine entry not found', 'MEDICINE_NOT_FOUND');
    }

    return success(entry);
  } catch (error) {
    console.error('getMedicine error:', error);

    return failure('Failed to get medicine entry', 'GET_MEDICINE_BY_ID_ERROR');
  }
}

// Update medicine
export async function updateMedicine(userId, id, data) {
  try {
    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_ID');
    }
    if (data.week_number > 40) {
      return failure('Please enter a valid week number', 'INVALID_FEILDS');
    }
    const db = await openDB();

    // Only find this user's medicine entry
    const existingResult = await db.execute(
      `SELECT *
       FROM weekly_medicine
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const entry = existingResult.rows?._array?.[0];

    if (!entry) {
      return failure('Medicine entry not found', 'MEDICINE_NOT_FOUND');
    }

    // Basic validation for supplied fields
    if (data?.week_number !== undefined) {
      const week = Number(data.week_number);

      if (!Number.isInteger(week) || week < 1) {
        return failure(
          'week_number must be a positive integer',
          'INVALID_WEEK',
        );
      }
    }

    if (data?.name !== undefined && typeof data.name !== 'string') {
      return failure('name must be a string', 'INVALID_NAME');
    }

    if (data?.dose !== undefined && typeof data.dose !== 'string') {
      return failure('dose must be a string', 'INVALID_DOSE');
    }

    await db.execute(
      `UPDATE weekly_medicine
       SET week_number = ?,
           name = ?,
           dose = ?,
           time = ?,
           note = ?
       WHERE id = ?
         AND user_id = ?`,
      [
        data?.week_number ?? entry.week_number,
        data?.name ?? entry.name,
        data?.dose ?? entry.dose,
        data?.time ?? entry.time,
        data?.note ?? entry.note,
        parsedId,
        parsedUserId,
      ],
    );

    clearAgentContext(parsedUserId);

    return success({
      message: 'Medicine updated',
    });
  } catch (error) {
    console.error('updateMedicine error:', error);

    return failure('Failed to update medicine', 'UPDATE_MEDICINE_ERROR');
  }
}

// Delete medicine
export async function deleteMedicine(userId, id) {
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

    // Check that this medicine belongs to the current user
    const existingResult = await db.execute(
      `SELECT id
       FROM weekly_medicine
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const entry = existingResult.rows?._array?.[0];

    if (!entry) {
      return failure('Medicine entry not found', 'MEDICINE_NOT_FOUND');
    }

    await db.execute(
      `DELETE FROM weekly_medicine
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    clearAgentContext(parsedUserId);

    return success({
      message: 'Medicine entry deleted',
    });
  } catch (error) {
    console.error('deleteMedicine error:', error);

    return failure('Failed to delete medicine', 'DELETE_MEDICINE_ERROR');
  }
}

// Mark medicine as taken / not taken
export async function markMedicineTaken(userId, id, taken = true) {
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

    // Only access this user's medicine
    const existingResult = await db.execute(
      `SELECT id
       FROM weekly_medicine
       WHERE id = ?
         AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const entry = existingResult.rows?._array?.[0];

    if (!entry) {
      return failure('Medicine entry not found', 'MEDICINE_NOT_FOUND');
    }

    const takenStatus = Boolean(taken);

    await db.execute(
      `UPDATE weekly_medicine
       SET taken = ?
       WHERE id = ?
         AND user_id = ?`,
      [takenStatus ? 1 : 0, parsedId, parsedUserId],
    );

    clearAgentContext(parsedUserId);

    return success({
      message: `Medicine marked as ${takenStatus ? 'taken' : 'not taken'}`,
    });
  } catch (error) {
    console.error('markMedicineTaken error:', error);

    return failure('Failed to update medicine status', 'MARK_MEDICINE_ERROR');
  }
}
