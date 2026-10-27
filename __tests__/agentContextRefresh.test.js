/**
 * The assistant keeps the user's context in an in-memory cache. These tests
 * check that the cache is refreshed when blood pressure logs or the profile
 * change, so the assistant doesn't keep answering with old data.
 */

import {clearAllAgentContexts, getAgentContext} from '../src/storage/agent';
import {addBPLog, deleteBPLog, updateBPLog} from '../src/storage/bloodPressure';
import {deleteProfile, updateProfile} from '../src/storage/profile';

const USER_ID = 1;

let mockProfile;
let mockBPLogs;
let mockPauseAfterBPRead;

const rows = items => ({rows: {_array: items}});

// A small in-memory stand-in for the SQLite queries these modules run.
const mockDb = {
  execute: jest.fn(async (sql, params = []) => {
    if (sql.includes('INSERT INTO blood_pressure_logs')) {
      const [week_number, systolic, diastolic, time, note] = params;
      mockBPLogs.push({
        id: mockBPLogs.length + 1,
        week_number,
        systolic,
        diastolic,
        time,
        note,
        created_at: '2026-10-20',
      });
      return {rowsAffected: 1, insertId: mockBPLogs.length};
    }
    if (sql.includes('UPDATE blood_pressure_logs')) {
      const [week_number, systolic, diastolic, time, note, id] = params;
      Object.assign(
        mockBPLogs.find(log => log.id === id),
        {week_number, systolic, diastolic, time, note},
      );
      return {rowsAffected: 1};
    }
    if (sql.includes('DELETE FROM blood_pressure_logs')) {
      const countBefore = mockBPLogs.length;
      mockBPLogs = mockBPLogs.filter(log => log.id !== params[0]);
      return {rowsAffected: countBefore - mockBPLogs.length};
    }
    if (sql.includes('FROM blood_pressure_logs')) {
      // Looking up one entry passes [id, userId], listing passes [userId].
      if (params.length > 1) {
        return rows(mockBPLogs.filter(log => log.id === params[0]));
      }
      const snapshot = [...mockBPLogs];
      await mockPauseAfterBPRead?.();
      return rows(snapshot);
    }
    if (sql.includes('UPDATE profile')) {
      const [dueDate, user_location, lmp] = params;
      Object.assign(mockProfile, {dueDate, user_location, lmp});
      return {rowsAffected: 1};
    }
    if (sql.includes('DELETE FROM profile')) {
      mockProfile = null;
      return {rowsAffected: 1};
    }
    if (sql.includes('FROM profile')) {
      return rows(mockProfile ? [mockProfile] : []);
    }
    return rows([]);
  }),
};

jest.mock('../src/database', () => ({
  openDB: jest.fn(async () => mockDb),
}));

beforeEach(() => {
  clearAllAgentContexts();
  mockPauseAfterBPRead = undefined;
  mockProfile = {
    id: USER_ID,
    user_name: 'Asha',
    lmp: '2026-03-01',
    cycleLength: 28,
    periodLength: 5,
    age: 28,
    weight: 60,
    user_location: 'Pune',
    dueDate: '2026-12-06',
  };
  mockBPLogs = [
    {
      id: 1,
      week_number: 30,
      systolic: 118,
      diastolic: 76,
      time: '09:00',
      note: null,
      created_at: '2026-10-01',
    },
  ];
});

async function getRecentBloodPressure() {
  const response = await getAgentContext(USER_ID);
  return response.data.recent_data.blood_pressure;
}

describe('assistant context refresh', () => {
  it('includes a blood pressure log added after the context was loaded', async () => {
    expect(await getRecentBloodPressure()).toHaveLength(1);

    const response = await addBPLog(USER_ID, {
      week_number: 31,
      systolic: 142,
      diastolic: 95,
      time: '10:30',
    });

    expect(response.success).toBe(true);
    const bloodPressure = await getRecentBloodPressure();
    expect(bloodPressure).toHaveLength(2);
    expect(bloodPressure).toContainEqual(
      expect.objectContaining({systolic: 142, diastolic: 95}),
    );
  });

  it('shows the new values of an updated blood pressure log', async () => {
    await getRecentBloodPressure();

    const response = await updateBPLog(USER_ID, 1, {systolic: 150});

    expect(response.success).toBe(true);
    expect(await getRecentBloodPressure()).toEqual([
      expect.objectContaining({systolic: 150, diastolic: 76}),
    ]);
  });

  it('drops a deleted blood pressure log', async () => {
    await getRecentBloodPressure();

    const response = await deleteBPLog(USER_ID, 1);

    expect(response.success).toBe(true);
    expect(await getRecentBloodPressure()).toEqual([]);
  });

  it('does not cache a context that was built while the data changed', async () => {
    let readStarted;
    const bpReadStarted = new Promise(resolve => (readStarted = resolve));
    let finishRead;
    mockPauseAfterBPRead = () => {
      mockPauseAfterBPRead = undefined;
      readStarted();
      return new Promise(resolve => (finishRead = resolve));
    };

    // The build reads the old readings, then a new one is saved before it finishes.
    const inFlight = getAgentContext(USER_ID);
    await bpReadStarted;
    await addBPLog(USER_ID, {
      week_number: 31,
      systolic: 142,
      diastolic: 95,
      time: '10:30',
    });
    finishRead();
    const response = await inFlight;

    // The build that saw the old readings is redone, not returned or cached.
    expect(response.data.recent_data.blood_pressure).toHaveLength(2);
    expect(await getRecentBloodPressure()).toHaveLength(2);
  });

  it('uses the new due date after the profile is updated', async () => {
    const before = await getAgentContext(USER_ID);
    expect(before.data.profile.due_date).toBe('2026-12-06');

    const response = await updateProfile(USER_ID, {LMP: '2026-03-15'});

    expect(response.success).toBe(true);
    const after = await getAgentContext(USER_ID);
    expect(after.data.profile.due_date).toBe(mockProfile.dueDate);
    expect(after.data.profile.due_date).not.toBe('2026-12-06');
  });

  it('does not return a deleted profile', async () => {
    await getAgentContext(USER_ID);

    const response = await deleteProfile(USER_ID);

    expect(response.success).toBe(true);
    expect((await getAgentContext(USER_ID)).success).toBe(false);
  });
});
