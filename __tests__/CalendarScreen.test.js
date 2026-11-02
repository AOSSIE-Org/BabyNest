/**
 * Tests for CalendarScreen utility functions, including appointment timetable
 * time parsing and offset calculations (to_min).
 */

import {to_min} from '../src/Screens/CalendarScreen';

// Mock native/storage dependencies that are imported by CalendarScreen
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-modal-datetime-picker', () => 'DateTimePickerModal');
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));
jest.mock('../src/storage/appointments', () => ({
  addAppointment: jest.fn(),
  deleteAppointment: jest.fn(),
  getAppointments: jest.fn(),
  updateAppointment: jest.fn(),
}));

describe('CalendarScreen - to_min', () => {
  describe('12-hour AM/PM format parsing', () => {
    it('correctly converts PM times with space (e.g., "02:00 PM")', () => {
      expect(to_min('02:00 PM')).toBe(840);
      expect(to_min('01:15 PM')).toBe(795);
      expect(to_min('11:45 PM')).toBe(1425);
    });

    it('correctly converts PM times without space (e.g., "02:00PM")', () => {
      expect(to_min('02:00PM')).toBe(840);
      expect(to_min('01:15PM')).toBe(795);
      expect(to_min('11:45PM')).toBe(1425);
    });

    it('is case-insensitive for AM/PM indicators (e.g., "02:00pm", "09:30am")', () => {
      expect(to_min('02:00 pm')).toBe(840);
      expect(to_min('02:00pm')).toBe(840);
      expect(to_min('09:30 am')).toBe(570);
      expect(to_min('09:30am')).toBe(570);
    });

    it('correctly converts AM times with and without space', () => {
      expect(to_min('09:00 AM')).toBe(540);
      expect(to_min('09:00AM')).toBe(540);
      expect(to_min('10:30 AM')).toBe(630);
      expect(to_min('10:30AM')).toBe(630);
    });

    it('correctly handles 12:00 PM (noon) as 720 minutes from midnight', () => {
      expect(to_min('12:00 PM')).toBe(720);
      expect(to_min('12:00PM')).toBe(720);
      expect(to_min('12:30 PM')).toBe(750);
      expect(to_min('12:30PM')).toBe(750);
    });

    it('correctly handles 12:00 AM (midnight) as 0 minutes from midnight', () => {
      expect(to_min('12:00 AM')).toBe(0);
      expect(to_min('12:00AM')).toBe(0);
      expect(to_min('12:45 AM')).toBe(45);
      expect(to_min('12:45AM')).toBe(45);
    });
  });

  describe('24-hour format parsing', () => {
    it('correctly converts 24-hour format strings', () => {
      expect(to_min('00:00')).toBe(0);
      expect(to_min('08:30')).toBe(510);
      expect(to_min('14:00')).toBe(840);
      expect(to_min('14:30')).toBe(870);
      expect(to_min('23:59')).toBe(1439);
    });
  });

  describe('edge cases and invalid inputs', () => {
    it('returns 0 for null, undefined, and non-string inputs', () => {
      expect(to_min(null)).toBe(0);
      expect(to_min(undefined)).toBe(0);
      expect(to_min('')).toBe(0);
      expect(to_min(1234)).toBe(0);
      expect(to_min({})).toBe(0);
    });

    it('returns 0 for strings missing a colon or with invalid minute parts', () => {
      expect(to_min('invalid')).toBe(0);
      expect(to_min('1400')).toBe(0);
      expect(to_min('12:')).toBe(0);
      expect(to_min('invalid:time')).toBe(0);
    });

    it('handles leading and trailing whitespace properly', () => {
      expect(to_min('  02:00 PM  ')).toBe(840);
      expect(to_min('  14:30  ')).toBe(870);
    });
  });
});
