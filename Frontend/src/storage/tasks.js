import {openDB} from '../database';
import {success, failure} from '../utils/serviceResponse';
import {clearAgentContext} from './agent';

// Get all tasks for user
export async function getTasks(userId) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM tasks
       WHERE user_id = ?`,
      [parsedUserId],
    );

    return success(result.rows?._array ?? []);
  } catch (error) {
    console.error('getTasks error:', error);

    return failure('Failed to get tasks', 'GET_TASKS_ERROR');
  }
}

// Get task by ID (||)
export async function getTask(userId, taskId) {
  try {
    const parsedUserId = Number(userId);
    const parsedTaskId = Number(taskId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedTaskId)) {
      return failure('task_id must be a valid integer', 'INVALID_TASK_ID');
    }

    const db = await openDB();

    const result = await db.execute(
      `SELECT *
       FROM tasks
       WHERE id = ?
         AND user_id = ?`,
      [parsedTaskId, parsedUserId],
    );

    const task = result.rows?._array?.[0];

    if (!task) {
      return failure('Task not found', 'TASK_NOT_FOUND');
    }

    return success(task);
  } catch (error) {
    console.error('getTask error:', error);

    return failure('Failed to get task', 'GET_TASK_ERROR');
  }
}

// Add task
export async function addTask(userId, data) {
  try {
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    const required = ['title', 'content', 'starting_week', 'ending_week'];

    const missing = required.filter(
      field => data?.[field] === undefined || data?.[field] === null,
    );

    if (missing.length > 0) {
      return failure(
        `Missing required fields: ${missing.join(', ')}`,
        'MISSING_FIELDS',
      );
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
      `INSERT INTO tasks (
        title,
        content,
        starting_week,
        ending_week,
        task_status,
        task_priority,
        isOptional,
        isAppointmentMade,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.content,
        data.starting_week,
        data.ending_week,
        data.task_status ?? 'pending',
        data.task_priority ?? 'low',
        data.isOptional ? 1 : 0,
        data.isAppointmentMade ? 1 : 0,
        parsedUserId,
      ],
    );

    clearAgentContext(parsedUserId);

    return success({
      id: result.insertId,
      message: 'Task added',
    });
  } catch (error) {
    console.error('addTask error:', error);

    return failure('Failed to add task', 'ADD_TASK_ERROR');
  }
}

// Update task
export async function updateTask(userId, taskId, data) {
  try {
    const parsedUserId = Number(userId);
    const parsedTaskId = Number(taskId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedTaskId)) {
      return failure('task_id must be a valid integer', 'INVALID_TASK_ID');
    }

    if (Number(data?.ending_week) > 40) {
      return failure('Ending week cannot be greater than 40', 'INVALID_VALUE');
    }

    const db = await openDB();

    // Only find this user's task
    const existingResult = await db.execute(
      `SELECT *
       FROM tasks
       WHERE id = ?
         AND user_id = ?`,
      [parsedTaskId, parsedUserId],
    );

    const task = existingResult.rows?._array?.[0];

    if (!task) {
      return failure('Task not found', 'TASK_NOT_FOUND');
    }

    await db.execute(
      `UPDATE tasks
       SET title = ?,
           content = ?,
           starting_week = ?,
           ending_week = ?,
           task_status = ?,
           task_priority = ?,
           isOptional = ?,
           isAppointmentMade = ?
       WHERE id = ?
         AND user_id = ?`,
      [
        data?.title ?? task.title,
        data?.content ?? task.content,
        data?.starting_week ?? task.starting_week,
        data?.ending_week ?? task.ending_week,
        data?.task_status ?? task.task_status,
        data?.task_priority ?? task.task_priority,
        data?.isOptional !== undefined
          ? data.isOptional
            ? 1
            : 0
          : task.isOptional,
        data?.isAppointmentMade !== undefined
          ? data.isAppointmentMade
            ? 1
            : 0
          : task.isAppointmentMade,
        parsedTaskId,
        parsedUserId,
      ],
    );

    clearAgentContext(parsedUserId);

    return success({
      message: 'Task updated',
    });
  } catch (error) {
    console.error('updateTask error:', error);

    return failure('Failed to update task', 'UPDATE_TASK_ERROR');
  }
}

// Delete task (||)
export async function deleteTask(userId, taskId) {
  try {
    const parsedUserId = Number(userId);
    const parsedTaskId = Number(taskId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedTaskId)) {
      return failure('task_id must be a valid integer', 'INVALID_TASK_ID');
    }

    const db = await openDB();

    // Only delete this user's task
    const result = await db.execute(
      `DELETE FROM tasks
       WHERE id = ?
         AND user_id = ?`,
      [parsedTaskId, parsedUserId],
    );

    if (result.rowsAffected === 0) {
      return failure('Task not found', 'TASK_NOT_FOUND');
    }

    clearAgentContext(parsedUserId);

    return success({
      message: 'Task deleted',
    });
  } catch (error) {
    console.error('deleteTask error:', error);

    return failure('Failed to delete task', 'DELETE_TASK_ERROR');
  }
}

// Move task to appointment
export async function moveTaskToAppointment(userId, taskId, data) {
  try {
    const parsedUserId = Number(userId);
    const parsedTaskId = Number(taskId);

    if (!Number.isInteger(parsedUserId)) {
      return failure('user_id must be a valid integer', 'INVALID_USER_ID');
    }

    if (!Number.isInteger(parsedTaskId)) {
      return failure('task_id must be a valid integer', 'INVALID_TASK_ID');
    }

    const required = [
      'appointment_date',
      'appointment_time',
      'appointment_location',
    ];

    const missing = required.filter(
      field => data?.[field] === undefined || data?.[field] === null,
    );

    if (missing.length > 0) {
      return failure(
        `Missing required fields: ${missing.join(', ')}`,
        'MISSING_FIELDS',
      );
    }

    const db = await openDB();

    // Get only this user's task
    const taskResult = await db.execute(
      `SELECT *
       FROM tasks
       WHERE id = ?
         AND user_id = ?`,
      [parsedTaskId, parsedUserId],
    );

    const task = taskResult.rows?._array?.[0];

    if (!task) {
      return failure('Task not found', 'TASK_NOT_FOUND');
    }

    const appointmentTitle = data.appointment_title ?? task.title;

    const appointmentContent = data.appointment_content ?? task.content;

    // Mark task as appointment
    await db.execute(
      `UPDATE tasks
       SET isAppointmentMade = 1
       WHERE id = ?
         AND user_id = ?`,
      [parsedTaskId, parsedUserId],
    );

    // Create appointment for the same user
    const appointmentResult = await db.execute(
      `INSERT INTO appointments (
        title,
        content,
        appointment_date,
        appointment_time,
        appointment_location,
        appointment_status,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentTitle,
        appointmentContent,
        data.appointment_date,
        data.appointment_time,
        data.appointment_location,
        'pending',
        parsedUserId,
      ],
    );

    clearAgentContext(parsedUserId);

    return success({
      appointment_id: appointmentResult.insertId,
      message: 'Task moved to appointment',
    });
  } catch (error) {
    console.error('moveTaskToAppointment error:', error);

    return failure(
      'Failed to move task to appointment',
      'MOVE_TASK_APPOINTMENT_ERROR',
    );
  }
}
