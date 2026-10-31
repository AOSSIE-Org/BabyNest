import {ragService} from '../src/services/RAGService';
import {addWeight} from '../src/storage/weight';
import {addSymptom} from '../src/storage/symptoms';
import {addBPLog} from '../src/storage/bloodPressure';
import {addMedicine} from '../src/storage/medicine';
import {addDischargeLog} from '../src/storage/discharge';
import {addTask} from '../src/storage/tasks';

jest.mock('../src/model/model', () => ({
  generateRAGResponse: jest.fn(),
  generateResponse: jest.fn(),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    displayNotification: jest.fn(),
    createChannel: jest.fn(),
    createTriggerNotification: jest.fn(),
    getNotificationSettings: jest.fn(async () => ({android: {alarm: true}})),
    cancelNotification: jest.fn(),
    cancelAllNotifications: jest.fn(),
  },
  TriggerType: {TIMESTAMP: 0},
  AndroidImportance: {HIGH: 4},
  AndroidNotificationSetting: {ENABLED: 1},
}));

jest.mock('../src/database', () => ({
  openDB: jest.fn(async () => ({
    execute: jest.fn(async () => ({rows: {_array: []}})),
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async key => (key === 'user_id' ? '1' : null)),
  setItem: jest.fn(async () => {}),
}));

jest.mock('../src/storage/weight', () => ({
  addWeight: jest.fn(async () => ({success: true, data: {}})),
}));

jest.mock('../src/storage/symptoms', () => ({
  addSymptom: jest.fn(async () => ({success: true, data: {}})),
}));

jest.mock('../src/storage/bloodPressure', () => ({
  addBPLog: jest.fn(async () => ({success: true, data: {}})),
}));

jest.mock('../src/storage/medicine', () => ({
  addMedicine: jest.fn(async () => ({success: true, data: {}})),
}));

jest.mock('../src/storage/discharge', () => ({
  addDischargeLog: jest.fn(async () => ({success: true, data: {}})),
}));

jest.mock('../src/storage/tasks', () => ({
  addTask: jest.fn(async () => ({success: true, data: {}})),
}));

describe('RAGService null userContext safe handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('safely handles null userContext when logging weight', async () => {
    const result = await ragService.logWeight({weight: 65}, null);
    expect(result.success).toBe(true);
    expect(addWeight).toHaveBeenCalledWith('1', expect.objectContaining({
      weight: 65,
      week_number: 12,
    }));
  });

  it('safely handles null userContext when logging symptoms', async () => {
    const result = await ragService.logSymptoms({symptom: 'Nausea'}, null);
    expect(result.success).toBe(true);
    expect(addSymptom).toHaveBeenCalledWith('1', expect.objectContaining({
      symptom: 'Nausea',
      week_number: 12,
    }));
  });

  it('safely handles null userContext when logging blood pressure', async () => {
    const result = await ragService.logBloodPressure({systolic: 120, diastolic: 80}, null);
    expect(result.success).toBe(true);
    expect(addBPLog).toHaveBeenCalledWith('1', expect.objectContaining({
      systolic: 120,
      diastolic: 80,
      week_number: 12,
    }));
  });

  it('safely handles null userContext when logging medicine', async () => {
    const result = await ragService.logMedicine({name: 'Folic Acid'}, null);
    expect(result.success).toBe(true);
    expect(addMedicine).toHaveBeenCalledWith('1', expect.objectContaining({
      name: 'Folic Acid',
      week_number: 12,
    }));
  });

  it('safely handles null userContext when logging discharge', async () => {
    const result = await ragService.logDischarge({type: 'Normal', color: 'Clear'}, null);
    expect(result.success).toBe(true);
    expect(addDischargeLog).toHaveBeenCalledWith('1', expect.objectContaining({
      type: 'Normal',
      color: 'Clear',
      week_number: 12,
    }));
  });

  it('safely handles null userContext when creating a task', async () => {
    const result = await ragService.createTask({title: 'Prenatal Visit'}, null);
    expect(result.success).toBe(true);
    expect(addTask).toHaveBeenCalledWith('1', expect.objectContaining({
      title: 'Prenatal Visit',
      starting_week: 12,
      ending_week: 12,
    }));
  });
});
