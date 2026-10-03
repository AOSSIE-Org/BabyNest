import {openDB} from '../database';
import {success, failure} from '../utils/serviceResponse';

const DEFAULT_APPOINTMENTS = [
  {
    title: 'Initial OB Appointment',
    content: 'Confirm pregnancy and general health.',
    daysAfter: 0,
    time: '09:00 AM',
    location: 'City Clinic',
  },
  {
    title: 'Blood Work',
    content: 'Routine prenatal blood tests.',
    daysAfter: 7,
    time: '10:00 AM',
    location: 'LabCorp',
  },
  {
    title: 'Nutritional Counseling',
    content: 'Discuss prenatal diet and supplements.',
    daysAfter: 14,
    time: '11:00 AM',
    location: 'Wellness Center',
  },
  {
    title: 'First Ultrasound',
    content: 'Early scan to check for heartbeat.',
    daysAfter: 21,
    time: '10:30 AM',
    location: 'City Hospital',
  },
  {
    title: 'Routine Check-up',
    content: 'Weekly monitoring and vitals.',
    daysAfter: 28,
    time: '09:30 AM',
    location: 'OB-GYN Office',
  },
  {
    title: 'NT Scan Appointment',
    content: 'Nuchal translucency scan scheduling.',
    daysAfter: 35,
    time: '02:00 PM',
    location: 'Radiology Dept.',
  },
  {
    title: 'Screening Lab Visit',
    content: 'Down syndrome blood screening.',
    daysAfter: 42,
    time: '10:15 AM',
    location: 'Prenatal Lab',
  },
  {
    title: 'Follow-up Visit',
    content: 'Review test results and progress.',
    daysAfter: 49,
    time: '09:00 AM',
    location: 'HealthCare Clinic',
  },
  {
    title: 'Anomaly Scan Prep',
    content: 'Discuss upcoming detailed scan.',
    daysAfter: 56,
    time: '11:30 AM',
    location: 'OB-GYN Center',
  },
  {
    title: 'Mid-pregnancy Checkup',
    content: 'Weight, BP, baby growth tracking.',
    daysAfter: 63,
    time: '01:00 PM',
    location: 'Wellness Clinic',
  },
  {
    title: 'Vaccination Discussion',
    content: 'Discuss vaccines for pregnancy.',
    daysAfter: 70,
    time: '12:30 PM',
    location: 'OB-GYN Office',
  },
  {
    title: 'Mood & Sleep Check-in',
    content: 'Mental health & fatigue talk.',
    daysAfter: 77,
    time: '10:00 AM',
    location: 'Care Center',
  },
];

function calculateDueDate(lmp, cycleLength) {
  const lmpDate = new Date(`${lmp}T00:00:00`);

  if (Number.isNaN(lmpDate.getTime())) {
    throw new Error('Invalid lmp date format, expected YYYY-MM-DD');
  }

  const adjustment = cycleLength ? Number(cycleLength) - 28 : 0;

  lmpDate.setDate(lmpDate.getDate() + 280 + adjustment);

  return lmpDate.toISOString().split('T')[0];
}

function calculateAppointmentDate(lmp, daysAfter) {
  const date = new Date(`${lmp}T00:00:00`);

  date.setDate(date.getDate() + daysAfter);

  return date.toISOString().split('T')[0];
}


/**
 * Create profile
 */
export async function createProfile(data) {
  try {
    if (!data) {
      return failure('No data provided', 'NO_DATA');
    }

    const {lmp, cycleLength, periodLength, age, weight, location} = data;

    // Required fields
    if (!lmp || !location) {
      return failure('lmp and location are required', 'MISSING_FIELD');
    }

    // Validate cycleLength
    if (
      cycleLength === undefined ||
      cycleLength === null ||
      !Number.isInteger(cycleLength)
    ) {
      return failure(
        'cycleLength must be a valid integer',
        'INVALID_CYCLE_LENGTH',
      );
    }

    // Validate LMP
    if (typeof lmp !== 'string') {
      return failure('lmp must be a valid date string', 'INVALID_LMP');
    }

    // Calculate due date
    let dueDate;

    try {
      dueDate = calculateDueDate(lmp, cycleLength);
    } catch {
      return failure(
        'Invalid lmp date format, expected YYYY-MM-DD',
        'INVALID_LMP_DATE',
      );
    }

    const db = await openDB();

    // Use a transaction so profile + appointments are
    // created together.
    await db.execute('BEGIN TRANSACTION');

    try {
      // Create profile
      const result = await db.execute(
        `
        INSERT INTO profile
        (
          lmp,
          cycleLength,
          periodLength,
          age,
          weight,
          user_location,
          dueDate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          lmp,
          cycleLength,
          periodLength ?? null,
          age ?? null,
          weight ?? null,
          location,
          dueDate,
        ],
      );

      const userId = result.insertId;

      // Create default appointments
      for (const appointment of DEFAULT_APPOINTMENTS) {
        const appointmentDate = calculateAppointmentDate(
          lmp,
          appointment.daysAfter,
        );

        await db.execute(
          `
          INSERT INTO appointments
          (
            user_id,
            title,
            content,
            appointment_date,
            appointment_time,
            appointment_location,
            appointment_status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            userId,
            appointment.title,
            appointment.content,
            appointmentDate,
            appointment.time,
            appointment.location,
            'pending',
          ],
        );
      }

      await db.execute('COMMIT');

      return success({
        status: 'success',
        message: 'Profile set successfully with due date',
        dueDate,
        userId: String(userId),
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('createProfile error:', error);

    return failure('Failed to create profile', 'PROFILE_CREATE_ERROR');
  }
}

/**
 * Get profile by user ID
 */
export async function getProfile(userId) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const db = await openDB();

    const result = await db.execute('SELECT * FROM profile WHERE id = ?', [
      parsedUserId,
    ]);

    const profile = result.rows?._array?.[0];

    if (!profile) {
      return failure('Profile not found', 'PROFILE_NOT_FOUND');
    }

    return success(profile);
  } catch (error) {
    console.error('getProfile error:', error);

    return failure('Failed to fetch profile', 'PROFILE_FETCH_ERROR');
  }
}

/**
 * Delete profile and its appointments
 */
export async function deleteProfile(userId) {
  try {
    if (!userId) {
      return failure('user_id is required', 'MISSING_USER_ID');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const db = await openDB();

    await db.execute('BEGIN TRANSACTION');

    try {
      // Check profile exists first
      const profileResult = await db.execute(
        'SELECT id FROM profile WHERE id = ?',
        [parsedUserId],
      );

      const profile = profileResult.rows?._array?.[0];

      if (!profile) {
        await db.execute('ROLLBACK');

        return failure('Profile not found', 'PROFILE_NOT_FOUND');
      }

      // Delete profile
      await db.execute('DELETE FROM profile WHERE id = ?', [parsedUserId]);

      // Delete associated appointments
      await db.execute('DELETE FROM appointments WHERE user_id = ?', [
        parsedUserId,
      ]);

      await db.execute('COMMIT');

      return success({
        status: 'success',
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('deleteProfile error:', error);

    return failure('Failed to delete profile', 'PROFILE_DELETE_ERROR');
  }
}

/**
 * Update profile
 */
export async function updateProfile(userId, data) {
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

    const db = await openDB();

    // Get existing profile
    const result = await db.execute('SELECT * FROM profile WHERE id = ?', [
      parsedUserId,
    ]);

    const profile = result.rows?._array?.[0];

    if (!profile) {
      return failure('Profile not found', 'PROFILE_NOT_FOUND');
    }

    // Use new value if provided,
    // otherwise keep existing value.
    const lmp = data.LMP ?? profile.lmp;
    const cycleLength = data.cycleLength ?? profile.cycleLength;
    const periodLength = data.periodLength ?? profile.periodLength;
    const age = data.age ?? profile.age;
    const weight = data.weight ?? profile.weight;
    const location = data.location ?? profile.user_location;
    const userName = data.name ?? profile.user_name;

    // Validate cycle length
    if (!Number.isInteger(Number(cycleLength))) {
      return failure(
        'cycleLength must be a valid integer',
        'INVALID_CYCLE_LENGTH',
      );
    }

    // Validate LMP
    if (typeof lmp !== 'string') {
      return failure('lmp must be a valid date string', 'INVALID_LMP');
    }

    let dueDate;

    try {
      dueDate = calculateDueDate(lmp, Number(cycleLength));
    } catch {
      return failure(
        'Invalid lmp date format, expected YYYY-MM-DD',
        'INVALID_LMP_DATE',
      );
    }

    await db.execute(
      `
      UPDATE profile
      SET
        dueDate = ?,
        user_location = ?,
        lmp = ?,
        cycleLength = ?,
        periodLength = ?,
        age = ?,
        weight = ?,
        user_name = ?
      WHERE id = ?
      `,
      [
        dueDate,
        location,
        lmp,
        Number(cycleLength),
        periodLength ?? null,
        age ?? null,
        weight ?? null,
        userName ?? null,
        parsedUserId,
      ],
    );

    return success({
      status: 'success',
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('updateProfile error:', error);

    return failure('Failed to update profile', 'PROFILE_UPDATE_ERROR');
  }
}
