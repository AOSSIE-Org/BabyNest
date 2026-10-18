import {openDB} from '../database';
import {success, failure} from '../utils/serviceResponse';
import {clearAgentContext} from './agent';

// Validation helpers
function validateWeekNumber(week) {
  const parsedWeek = Number(week);

  if (!Number.isInteger(parsedWeek) || parsedWeek < 1 || parsedWeek > 42) {
    return {
      status: false,
      error: 'Week number must be an integer between 1 and 42',
    };
  }

  return {status: true};
}

function validateWeightValue(weight) {
  const parsedWeight = Number(weight);

  if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
    return {
      status: false,
      error: 'Weight must be a valid positive number',
    };
  }

  return {status: true};
}

// Create
export async function addWeight(userId, data) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const required = ['week_number', 'weight'];

    const missing = required.filter(
      field => data?.[field] === undefined || data?.[field] === null,
    );

    if (missing.length > 0) {
      return failure(
        `Missing required fields: ${missing.join(', ')}`,
        'MISSING_FIELDS',
      );
    }

    const week = data.week_number;
    const weight = data.weight;
    const note = data.note ?? null;

    const weekResult = validateWeekNumber(week);
    const weightResult = validateWeightValue(weight);

    if (!weekResult.status) {
      return failure(weekResult.error, 'INVALID_WEEK_NUMBER');
    }

    if (!weightResult.status) {
      return failure(weightResult.error, 'INVALID_WEIGHT');
    }

    const db = await openDB();

    // Make sure user exists
    const profileResult = await db.execute(
      `SELECT id FROM profile WHERE id = ?`,
      [parsedUserId],
    );

    if (!profileResult.rows?._array?.length) {
      return failure('User profile not found', 'USER_NOT_FOUND');
    }

    const result = await db.execute(
      `INSERT INTO weekly_weight (
        week_number,
        weight,
        note,
        user_id
      )
      VALUES (?, ?, ?, ?)`,
      [week, weight, note, parsedUserId],
    );

    clearAgentContext(parsedUserId);

    return success({
      id: result.insertId,
      message: 'Weight added',
    });
  } catch (error) {
    console.error('addWeight error:', error);

    return failure('Failed to add weight', 'ADD_WEIGHT_ERROR');
  }
}

// Read all 
export async function getAllWeights(userId) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM weekly_weight
       WHERE user_id = ?
       ORDER BY id DESC`,
      [parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getAllWeights error:', error);

    return failure('Failed to get weights', 'GET_WEIGHTS_ERROR');
  }
}

// Read by week (||)
export async function getWeekWeight(userId, week) {
  try {
    const parsedUserId = Number(userId);
    const parsedWeek = Number(week);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedWeek)) {
      return failure(
        'week_number must be a valid integer',
        'INVALID_WEEK_NUMBER',
      );
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM weekly_weight
       WHERE week_number = ?
       AND user_id = ?
       ORDER BY id DESC`,
      [parsedWeek, parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getWeekWeight error:', error);

    return failure('Failed to get weekly weight', 'GET_WEEK_WEIGHT_ERROR');
  }
}

// Read by ID (||)
export async function getWeight(userId, id) {
  try {
    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_WEIGHT_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM weekly_weight
       WHERE id = ?
       AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const weight = result.rows?._array?.[0];

    if (!weight) {
      return failure('Weight entry not found', 'WEIGHT_NOT_FOUND');
    }

    return success(weight);
  } catch (error) {
    console.error('getWeight error:', error);

    return failure('Failed to get weight', 'GET_WEIGHT_ERROR');
  }
}

// Update by ID
export async function updateWeight(userId, id, data) {
  try {
    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_WEIGHT_ID');
    }

    const db = await openDB();

    const existingResult = await db.execute(
      `SELECT *
       FROM weekly_weight
       WHERE id = ?
       AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    const weightEntry = existingResult.rows?._array?.[0];

    if (!weightEntry) {
      return failure('Weight entry not found', 'WEIGHT_NOT_FOUND');
    }

    const weekNumber = data?.week_number ?? weightEntry.week_number;

    const weight = data?.weight ?? weightEntry.weight;

    const note = data?.note ?? weightEntry.note;

    const weekResult = validateWeekNumber(weekNumber);

    const weightResult = validateWeightValue(weight);

    if (!weekResult.status) {
      return failure(weekResult.error, 'INVALID_WEEK_NUMBER');
    }

    if (!weightResult.status) {
      return failure(weightResult.error, 'INVALID_WEIGHT');
    }

    await db.execute(
      `UPDATE weekly_weight
       SET week_number = ?,
           weight = ?,
           note = ?
       WHERE id = ?
       AND user_id = ?`,
      [weekNumber, weight, note, parsedId, parsedUserId],
    );

    clearAgentContext(parsedUserId);

    return success({
      message: 'Weight updated',
    });
  } catch (error) {
    console.error('updateWeight error:', error);

    return failure('Failed to update weight', 'UPDATE_WEIGHT_ERROR');
  }
}

// Delete by ID
export async function deleteWeight(userId, id) {
  try {
    const parsedUserId = Number(userId);
    const parsedId = Number(id);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedId)) {
      return failure('id must be a valid integer', 'INVALID_WEIGHT_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `DELETE FROM weekly_weight
       WHERE id = ?
       AND user_id = ?`,
      [parsedId, parsedUserId],
    );

    if (result.rowsAffected === 0) {
      return failure('Weight entry not found', 'WEIGHT_NOT_FOUND');
    }

    clearAgentContext(parsedUserId);

    return success({
      message: 'Weight entry deleted',
    });
  } catch (error) {
    console.error('deleteWeight error:', error);

    return failure('Failed to delete weight', 'DELETE_WEIGHT_ERROR');
  }
}
