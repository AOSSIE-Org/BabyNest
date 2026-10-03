import {openDB} from '../database';
import {success, failure} from '../utils/serviceResponse';
import GUIDELINES from '../data/guidelines.json';

// In-memory cache only.
// Nothing is written to disk.
const contextCache = new Map();

/**
 * Get agent context for a user.
 *
 * 1. Check memory cache
 * 2. If not available, build context from SQLite
 * 3. Store it in memory cache
 * 4. Return context
 */
export async function getAgentContext(userId) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    // 1. Check memory cache
    if (contextCache.has(parsedUserId)) {
      const context = contextCache.get(parsedUserId);

      return success({
        context,
        timestamp: context.last_updated,
        current_week: context.current_week,
        profile: {
          location: context.location,
          age: context.age,
          weight: context.weight,
          due_date: context.due_date,
          lmp: context.lmp,
          cycle_length: context.cycle_length,
          period_length: context.period_length,
        },
        recent_data: {
          weight: context.tracking_data.weight,
          symptoms: context.tracking_data.symptoms,
          medicine: context.tracking_data.medicine,
          blood_pressure: context.tracking_data.blood_pressure,
          discharge: context.tracking_data.discharge,
        },
      });
    }

    // 2. Build context from SQLite
    const context = await buildContext(parsedUserId);

    if (!context) {
      return failure('No context available', 'CONTEXT_NOT_FOUND');
    }

    // 3. Save ONLY in memory
    contextCache.set(parsedUserId, context);

    // 4. Return context
    return success({
      context,
      timestamp: context.last_updated,
      current_week: context.current_week,
      profile: {
        location: context.location,
        age: context.age,
        weight: context.weight,
        due_date: context.due_date,
        lmp: context.lmp,
        cycle_length: context.cycle_length,
        period_length: context.period_length,
      },
      recent_data: {
        weight: context.tracking_data.weight,
        symptoms: context.tracking_data.symptoms,
        medicine: context.tracking_data.medicine,
        blood_pressure: context.tracking_data.blood_pressure,
        discharge: context.tracking_data.discharge,
      },
    });
  } catch (error) {
    console.error('getAgentContext error:', error);

    return failure('Failed to get agent context', 'CONTEXT_FETCH_ERROR');
  }
}

/**
 * Build context directly from SQLite.
 */
async function buildContext(userId) {
  const db = await openDB();

  // Profile
  const profileResult = await db.execute(
    `
    SELECT
      user_name,
      lmp,
      cycleLength,
      periodLength,
      age,
      weight,
      user_location,
      dueDate
    FROM profile
    WHERE id = ?
    LIMIT 1
    `,
    [userId],
  );

  const profile = profileResult.rows?._array?.[0];

  if (!profile) {
    return null;
  }

  const {lmp, cycleLength, periodLength, age, weight, user_location, dueDate} =
    profile;

  // Calculate current pregnancy week
  let currentWeek = 1;

  if (dueDate) {
    const dueDateObj = new Date(`${dueDate}T00:00:00`);

    if (!Number.isNaN(dueDateObj.getTime())) {
      const today = new Date();

      const difference = dueDateObj.getTime() - today.getTime();

      const daysLeft = Math.floor(difference / (1000 * 60 * 60 * 24));

      const weeksLeft = Math.floor(daysLeft / 7);

      currentWeek = 40 - weeksLeft;

      currentWeek = Math.max(1, Math.min(currentWeek, 40));
    }
  }

  // Recent weight
  const weightResult = await db.execute(
    `
    SELECT
      week_number,
      weight,
      note,
      created_at
    FROM weekly_weight
    WHERE user_id = ?
    ORDER BY week_number DESC
    LIMIT 4
    `,
    [userId],
  );

  const weightData = weightResult.rows?._array ?? [];

  // Recent medicine
  const medicineResult = await db.execute(
    `
    SELECT
      week_number,
      name,
      dose,
      time,
      taken,
      note,
      created_at
    FROM weekly_medicine
    WHERE user_id = ? 
    ORDER BY week_number DESC
    LIMIT 4
    `,
    [userId],
  );

  const medicineData = medicineResult.rows?._array ?? [];

  // Recent symptoms
  const symptomsResult = await db.execute(
    `
    SELECT
      week_number,
      symptom,
      note,
      created_at
    FROM weekly_symptoms
    WHERE user_id = ? 
    ORDER BY week_number DESC
    LIMIT 4
    `,
    [userId],
  );

  const symptomsData = symptomsResult.rows?._array ?? [];

  // Recent blood pressure
  const bpResult = await db.execute(
    `
    SELECT
      week_number,
      systolic,
      diastolic,
      time,
      note,
      created_at
    FROM blood_pressure_logs
    WHERE user_id = ? 
    ORDER BY created_at DESC
    LIMIT 7
    `,
    [userId],
  );

  const bpData = bpResult.rows?._array ?? [];

  // Recent discharge
  const dischargeResult = await db.execute(
    `
      SELECT
        week_number,
        type,
        color,
        bleeding,
        note,
        created_at
      FROM discharge_logs
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 7
      `,
    [userId],
  );

  const dischargeData = dischargeResult.rows?._array ?? [];

  // Build context
  return {
    current_week: currentWeek,

    location: user_location,
    age,
    weight,
    due_date: dueDate,
    lmp,

    cycle_length: cycleLength,
    period_length: periodLength,

    tracking_data: {
      weight: weightData.map(item => ({
        week: item.week_number,
        weight: item.weight,
        note: item.note,
        date: item.created_at,
      })),

      medicine: medicineData.map(item => ({
        week: item.week_number,
        name: item.name,
        dose: item.dose,
        time: item.time,
        taken: item.taken,
        note: item.note,
        date: item.created_at,
      })),

      symptoms: symptomsData.map(item => ({
        week: item.week_number,
        symptom: item.symptom,
        note: item.note,
        date: item.created_at,
      })),

      blood_pressure: bpData.map(item => ({
        week: item.week_number,
        systolic: item.systolic,
        diastolic: item.diastolic,
        time: item.time,
        note: item.note,
        date: item.created_at,
      })),

      discharge: dischargeData.map(item => ({
        week: item.week_number,
        type: item.type,
        color: item.color,
        bleeding: item.bleeding,
        note: item.note,
        date: item.created_at,
      })),
    },

    last_updated: new Date().toISOString(),
  };
}

/**
 * Clear cached context for one user.
 */
export function clearAgentContext(userId) {
  if (!userId) {
    return;
  }

  const parsedUserId = Number(userId);

  contextCache.delete(parsedUserId);
}

/**
 * Clear all cached contexts.
 */
export function clearAllAgentContexts() {
  contextCache.clear();
  return true;
}

/**
 * Get task/recommendation guidelines
 * based on the user's current pregnancy week.
 */
export async function taskRecommendations(userId, week = null) {
  try {
    // Validate user ID

    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    // Get user context

    const contextResult = await getAgentContext(parsedUserId);

    if (!contextResult.success) {
      return failure('No user context available', 'CONTEXT_NOT_FOUND');
    }

    const context = contextResult.data.context;

    // Determine pregnancy week

    let currentWeek;

    if (week !== null && week !== undefined) {
      currentWeek = Number(week);

      if (!Number.isInteger(currentWeek)) {
        return failure('week must be a valid integer', 'INVALID_WEEK');
      }
    } else {
      currentWeek = Number(context.current_week) || 1;
    }

    // Find matching guidelines

    const recommendations = GUIDELINES.filter(guideline => {
      const range = parseWeekRange(guideline.week_range);

      if (!range) {
        return false;
      }

      const {startWeek, endWeek} = range;

      return currentWeek >= startWeek && currentWeek <= endWeek;
    });

    let finalRecommendations = recommendations;

    // If no exact match, find nearby
    // guidelines
    if (finalRecommendations.length === 0) {
      finalRecommendations = findNearbyGuidelines(currentWeek);
    }

    // Build response
    return success({
      recommendations: finalRecommendations,
      current_week: currentWeek,

      context_used: {
        weight: context.tracking_data?.weight ?? [],

        symptoms: context.tracking_data?.symptoms ?? [],

        medicine: context.tracking_data?.medicine ?? [],
      },
    });
  } catch (error) {
    console.error('getTaskRecommendations error:', error);

    return failure(
      'Failed to get task recommendations',
      'TASK_RECOMMENDATION_ERROR',
    );
  }
}

/**
 * Convert:
 *
 * "6-8"  → { startWeek: 6, endWeek: 8 }
 * "8-12" → { startWeek: 8, endWeek: 12 }
 * "40"   → { startWeek: 40, endWeek: 40 }
 */
function parseWeekRange(weekRange) {
  if (typeof weekRange !== 'string' || !weekRange.trim()) {
    return null;
  }

  const parts = weekRange.split('-').map(value => Number(value.trim()));

  if (parts.length === 1) {
    if (!Number.isInteger(parts[0])) {
      return null;
    }

    return {
      startWeek: parts[0],
      endWeek: parts[0],
    };
  }

  if (
    parts.length !== 2 ||
    !Number.isInteger(parts[0]) ||
    !Number.isInteger(parts[1])
  ) {
    return null;
  }

  return {
    startWeek: parts[0],
    endWeek: parts[1],
  };
}

/**
 * If there is no exact week-range match,
 * find guidelines closest to the current week.
 */
function findNearbyGuidelines(currentWeek) {
  const validGuidelines = GUIDELINES.map(guideline => {
    const range = parseWeekRange(guideline.week_range);

    if (!range) {
      return null;
    }

    let distance = 0;

    if (currentWeek < range.startWeek) {
      distance = range.startWeek - currentWeek;
    } else if (currentWeek > range.endWeek) {
      distance = currentWeek - range.endWeek;
    }

    return {
      guideline,
      distance,
    };
  })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);

  // Return guidelines from the nearest range.
  if (validGuidelines.length === 0) {
    return [];
  }

  const nearestDistance = validGuidelines[0].distance;

  return validGuidelines
    .filter(item => item.distance === nearestDistance)
    .map(item => item.guideline);
}
