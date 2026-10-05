/**
 * @format
 * Tests for EmergencyCallingScreen
 */

import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmergencyCallingScreen from '../src/Screens/EmergencyCallingScreen';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('EmergencyCallingScreen', () => {
  it('renders empty state when no contacts exist', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const strTree = JSON.stringify(renderer.toJSON());
    expect(strTree).toContain('No Emergency Contacts');
    expect(strTree).toContain(
      'Add at least one emergency contact to enable the SOS feature.',
    );
    expect(strTree).toContain('Add Emergency Contact');
    expect(strTree).toContain('Go Back');
  });

  it('renders countdown when contacts exist', async () => {
    const contacts = [{name: 'John Doe', phone: '+1234567890'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const strTree = JSON.stringify(renderer.toJSON());
    expect(strTree).toContain('Emergency Calling...');
    expect(strTree).toContain('John Doe');
    expect(strTree).toContain('+1234567890');
    expect(strTree).toContain('I AM SAFE');
  });

  it('countdown decrements when timer ticks', async () => {
    const contacts = [{name: 'Jane', phone: '+9876543210'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    expect(JSON.stringify(renderer.toJSON())).toContain('5');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(JSON.stringify(renderer.toJSON())).toContain('4');
  });

  it('"I AM SAFE" cancels countdown and navigates back', async () => {
    const contacts = [{name: 'Jane', phone: '+9876543210'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const root = renderer.root;
    const touchables = root.findAllByType('TouchableOpacity');
    const safeButton = touchables.find(t =>
      JSON.stringify(t.props).includes('I AM SAFE'),
    );
    expect(safeButton).toBeTruthy();

    act(() => {
      safeButton.props.onPress();
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('navigates back from empty state via Go Back', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const root = renderer.root;
    const touchables = root.findAllByType('TouchableOpacity');
    const goBackButton = touchables.find(t =>
      JSON.stringify(t.props).includes('Go Back'),
    );
    expect(goBackButton).toBeTruthy();

    act(() => {
      goBackButton.props.onPress();
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});
