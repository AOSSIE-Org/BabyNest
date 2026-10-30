/**
 * Due dates and default appointment dates are stored as YYYY-MM-DD. They must
 * not move by a day in timezones east of UTC, such as India.
 */

process.env.TZ = 'Asia/Kolkata';

import {createProfile, updateProfile} from '../src/storage/profile';

const USER_ID = 1;

let mockProfile;
let mockAppointmentDates;
let mockInsertedProfileParams;

const mockDb = {
  execute: jest.fn(async (sql, params = []) => {
    if (sql.includes('INSERT INTO profile')) {
      mockInsertedProfileParams = params;
      return {insertId: USER_ID};
    }
    if (sql.includes('INSERT INTO appointments')) {
      mockAppointmentDates.push(params[3]);
      return {rowsAffected: 1};
    }
    if (sql.includes('UPDATE profile')) {
      mockProfile.dueDate = params[0];
      return {rowsAffected: 1};
    }
    if (sql.includes('FROM profile')) {
      return {rows: {_array: [mockProfile]}};
    }
    return {rows: {_array: []}};
  }),
};

jest.mock('../src/database', () => ({
  openDB: jest.fn(async () => mockDb),
}));

jest.mock('../src/storage/agent', () => ({
  clearAgentContext: jest.fn(),
}));

jest.mock('../src/utils/mockUpHelper', () => ({
  calculatePregnancyWeek: jest.fn(() => 10),
  generateInitialMedicineData: jest.fn(() => []),
  generateInitialSymptoms: jest.fn(() => []),
  generateInitialWeightData: jest.fn(() => []),
  insertDefaultTasks: jest.fn(async () => {}),
}));

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  mockAppointmentDates = [];
  mockProfile = {
    id: USER_ID,
    lmp: '2026-03-01',
    cycleLength: 28,
    periodLength: 5,
    age: 28,
    weight: 60,
    user_location: 'Pune',
    user_name: 'Asha',
    dueDate: '2026-12-06',
  };
});

it('stores the due date 280 days after the LMP', async () => {
  const response = await createProfile({
    lmp: '2026-03-01',
    cycleLength: 28,
    location: 'Pune',
  });

  expect(response.success).toBe(true);
  expect(response.data.dueDate).toBe('2026-12-06');
  expect(mockInsertedProfileParams[6]).toBe('2026-12-06');
});

it('stores the default appointments on the right days', async () => {
  await createProfile({lmp: '2026-03-01', cycleLength: 28, location: 'Pune'});

  expect(mockAppointmentDates).toEqual([
    '2026-03-01',
    '2026-03-08',
    '2026-03-15',
    '2026-03-22',
    '2026-03-29',
    '2026-04-05',
    '2026-04-12',
    '2026-04-19',
    '2026-04-26',
    '2026-05-03',
    '2026-05-10',
    '2026-05-17',
  ]);
});

it('recalculates the due date on the right day when the LMP changes', async () => {
  const response = await updateProfile(USER_ID, {LMP: '2026-03-15'});

  expect(response.success).toBe(true);
  expect(mockProfile.dueDate).toBe('2026-12-20');
});
