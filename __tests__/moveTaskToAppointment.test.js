/**
 * Turning a task into an appointment should behave like adding an appointment
 * directly: the reminder is scheduled, and a task can only be turned into an
 * appointment once.
 */

import {moveTaskToAppointment} from '../src/storage/tasks';
import NotificationService from '../src/services/NotificationService';

const USER_ID = 1;
const TASK_ID = 7;

let mockTask;
let mockAppointments;

const rows = items => ({rows: {_array: items}});

// A small in-memory stand-in for the SQLite queries this function runs.
const mockDb = {
  execute: jest.fn(async (sql, params = []) => {
    if (sql.includes('INSERT INTO appointments')) {
      const [title, content, date, time, location, status, user_id] = params;
      mockAppointments.push({
        id: mockAppointments.length + 1,
        title,
        content,
        appointment_date: date,
        appointment_time: time,
        appointment_location: location,
        appointment_status: status,
        user_id,
      });
      return {rowsAffected: 1, insertId: mockAppointments.length};
    }
    if (sql.includes('UPDATE tasks')) {
      // Mirrors "AND COALESCE(isAppointmentMade, 0) = 0" in the real query.
      const onlyIfNotMade = sql.includes('isAppointmentMade, 0) = 0');
      if (onlyIfNotMade && mockTask.isAppointmentMade) {
        return {rowsAffected: 0};
      }
      mockTask.isAppointmentMade = 1;
      return {rowsAffected: 1};
    }
    if (sql.includes('FROM tasks')) {
      const [taskId, userId] = params;
      return rows(
        mockTask && mockTask.id === taskId && mockTask.user_id === userId
          ? [{...mockTask}]
          : [],
      );
    }
    // BEGIN TRANSACTION, COMMIT, ROLLBACK
    return rows([]);
  }),
};

jest.mock('../src/database', () => ({
  openDB: jest.fn(async () => mockDb),
}));

jest.mock('../src/services/NotificationService', () => ({
  __esModule: true,
  default: {
    scheduleAppointmentReminder: jest.fn(async () => {}),
  },
}));

const appointmentData = {
  appointment_date: '2026-11-20',
  appointment_time: '14:30',
  appointment_location: 'City Clinic',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAppointments = [];
  mockTask = {
    id: TASK_ID,
    user_id: USER_ID,
    title: 'NT Scan',
    content: 'Nuchal translucency scan.',
    isAppointmentMade: 0,
  };
});

describe('moveTaskToAppointment', () => {
  it('schedules a reminder for the new appointment', async () => {
    const result = await moveTaskToAppointment(
      USER_ID,
      TASK_ID,
      appointmentData,
    );

    expect(result.success).toBe(true);
    expect(result.data.appointment_id).toBe(1);
    expect(NotificationService.scheduleAppointmentReminder).toHaveBeenCalledTimes(
      1,
    );
    expect(NotificationService.scheduleAppointmentReminder).toHaveBeenCalledWith(
      'NT Scan',
      'Nuchal translucency scan.',
      '2026-11-20',
      '14:30',
      1,
    );
  });

  it('uses a custom title and content for the reminder when given', async () => {
    await moveTaskToAppointment(USER_ID, TASK_ID, {
      ...appointmentData,
      appointment_title: 'NT Scan with Dr. Rao',
      appointment_content: 'Bring the earlier reports.',
    });

    expect(NotificationService.scheduleAppointmentReminder).toHaveBeenCalledWith(
      'NT Scan with Dr. Rao',
      'Bring the earlier reports.',
      '2026-11-20',
      '14:30',
      1,
    );
  });

  it('still saves the appointment when the reminder cannot be scheduled', async () => {
    NotificationService.scheduleAppointmentReminder.mockRejectedValueOnce(
      new Error('notifications unavailable'),
    );
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await moveTaskToAppointment(
      USER_ID,
      TASK_ID,
      appointmentData,
    );

    expect(result.success).toBe(true);
    expect(mockAppointments).toHaveLength(1);
    warn.mockRestore();
  });

  it('does not create a second appointment for the same task', async () => {
    mockTask.isAppointmentMade = 1;

    const result = await moveTaskToAppointment(
      USER_ID,
      TASK_ID,
      appointmentData,
    );

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('APPOINTMENT_ALREADY_EXISTS');
    expect(mockAppointments).toHaveLength(0);
    expect(
      NotificationService.scheduleAppointmentReminder,
    ).not.toHaveBeenCalled();
  });

  it('rejects a conversion that loses the race to another call', async () => {
    // The task looked unconverted when it was read, but another call claims
    // it before this call's UPDATE runs.
    const realExecute = mockDb.execute.getMockImplementation();
    mockDb.execute.mockImplementationOnce(async (sql, params) => {
      const result = await realExecute(sql, params); // the SELECT
      mockTask.isAppointmentMade = 1; // someone else converts it now
      return result;
    });

    const result = await moveTaskToAppointment(
      USER_ID,
      TASK_ID,
      appointmentData,
    );

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('APPOINTMENT_ALREADY_EXISTS');
    expect(mockAppointments).toHaveLength(0);
    expect(mockDb.execute).toHaveBeenCalledWith('ROLLBACK');
    expect(
      NotificationService.scheduleAppointmentReminder,
    ).not.toHaveBeenCalled();
  });

  it('does not schedule a reminder when the task is not found', async () => {
    const result = await moveTaskToAppointment(USER_ID, 999, appointmentData);

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('TASK_NOT_FOUND');
    expect(
      NotificationService.scheduleAppointmentReminder,
    ).not.toHaveBeenCalled();
  });

  it('does not schedule a reminder when required fields are missing', async () => {
    const result = await moveTaskToAppointment(USER_ID, TASK_ID, {
      appointment_date: '2026-11-20',
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('MISSING_FIELDS');
    expect(
      NotificationService.scheduleAppointmentReminder,
    ).not.toHaveBeenCalled();
  });
});
