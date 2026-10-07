/**
 * @format
 * Tests for EmergencyCallingScreen
 */

import React from 'react';
import {
  TouchableOpacity,
  Linking,
  Platform,
  NativeModules,
  Alert,
} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import call from 'react-native-phone-call';
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

jest.mock('react-native-phone-call', () => jest.fn(() => Promise.resolve()));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

/**
 * Recursively extracts visible text content from a React Test Renderer JSON tree.
 */
function extractText(node) {
  if (!node) {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }
  if (node.children) {
    return extractText(node.children);
  }
  return '';
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('EmergencyCallingScreen', () => {
  it('renders loading indicator while contacts are loading', () => {
    AsyncStorage.getItem.mockReturnValueOnce(new Promise(() => {}));

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const root = renderer.root;
    expect(root.findByProps({testID: 'loading-indicator'})).toBeTruthy();
    expect(root.findAllByType(TouchableOpacity).length).toBe(0);

    act(() => {
      renderer.unmount();
    });
  });

  it('renders error state with retry when loading contacts fails', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage failure'));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });
    await act(async () => {});

    const textContent = extractText(renderer.toJSON());
    expect(textContent).toContain('Failed to Load Contacts');
    expect(renderer.root.findByProps({testID: 'retry-button'})).toBeTruthy();

    AsyncStorage.getItem.mockResolvedValueOnce(null);
    await act(async () => {
      renderer.root.findByProps({testID: 'retry-button'}).props.onPress();
    });

    expect(extractText(renderer.toJSON())).toContain('No Emergency Contacts');
  });

  it('renders empty state when no contacts exist', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const strTree = extractText(renderer.toJSON());
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

    const strTree = extractText(renderer.toJSON());
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

    expect(extractText(renderer.toJSON())).toContain('5');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(extractText(renderer.toJSON())).toContain('4');
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
    const safeButton = root.findByProps({testID: 'safe-button'});
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
    const goBackButton = root.findByProps({testID: 'go-back-button'});
    expect(goBackButton).toBeTruthy();

    act(() => {
      goBackButton.props.onPress();
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('invokes react-native-phone-call with normalized number when countdown expires', async () => {
    const contacts = [{name: 'Formatted Contact', phone: '+1 (555) 019-2831'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    await act(async () => {
      ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(call).toHaveBeenCalledWith({
      number: '+15550192831',
      prompt: false,
      skipCanOpen: true,
    });
  });

  it('invokes react-native-phone-call with normalized number when manual Call is pressed', async () => {
    const contacts = [{name: 'Manual Contact', phone: '+1 (800) 555-0199'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const callBtn = renderer.root.findByProps({testID: 'call-button-0'});
    await act(async () => {
      callBtn.props.onPress();
    });

    expect(call).toHaveBeenCalledWith({
      number: '+18005550199',
      prompt: false,
      skipCanOpen: true,
    });
  });

  it('aborts in-flight call if user cancels while call operation is pending', async () => {
    const contacts = [{name: 'Pending User', phone: '1234567890'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    // Advance 2s into countdown
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Press "I AM SAFE"
    const safeButton = renderer.root.findByProps({testID: 'safe-button'});
    act(() => {
      safeButton.props.onPress();
    });

    // Advance past remaining countdown time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(call).not.toHaveBeenCalled();
  });

  it('sends SMS with emergency body query via Linking on Android', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const contacts = [{name: 'Android SMS', phone: '+1 (555) 123-4567'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const smsBtn = renderer.root.findByProps({testID: 'sms-button-0'});
    await act(async () => {
      smsBtn.props.onPress();
    });

    expect(Linking.canOpenURL).toHaveBeenCalledWith(
      'sms:+15551234567?body=Emergency!%20I%20need%20help!',
    );
    expect(Linking.openURL).toHaveBeenCalledWith(
      'sms:+15551234567?body=Emergency!%20I%20need%20help!',
    );

    Platform.OS = originalOS;
  });

  it('invokes native SMSComposer on iOS with recipient and body', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'ios';
    NativeModules.SMSComposer = {
      sendSMS: jest.fn(() => Promise.resolve(true)),
    };

    const contacts = [{name: 'iOS SMS', phone: '+1 (555) 987-6543'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const smsBtn = renderer.root.findByProps({testID: 'sms-button-0'});
    await act(async () => {
      smsBtn.props.onPress();
    });

    expect(NativeModules.SMSComposer.sendSMS).toHaveBeenCalledWith(
      '+15559876543',
      'Emergency! I need help!',
    );

    delete NativeModules.SMSComposer;
    Platform.OS = originalOS;
  });

  it('falls back to recipient-only SMS link on iOS when native composer is unavailable or fails', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'ios';
    NativeModules.SMSComposer = {
      sendSMS: jest.fn(() => Promise.reject(new Error('Unavailable'))),
    };

    const contacts = [{name: 'iOS Fallback', phone: '9876543210'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const smsBtn = renderer.root.findByProps({testID: 'sms-button-0'});
    await act(async () => {
      smsBtn.props.onPress();
    });

    expect(Linking.canOpenURL).toHaveBeenCalledWith('sms:9876543210');
    expect(Linking.openURL).toHaveBeenCalledWith('sms:9876543210');

    delete NativeModules.SMSComposer;
    Platform.OS = originalOS;
  });

  it('stops countdown when manual Call button is tapped', async () => {
    const contacts = [
      {name: 'Primary', phone: '1111111111'},
      {name: 'Secondary', phone: '2222222222'},
    ];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const callButtonSecondary = renderer.root.findByProps({
      testID: 'call-button-1',
    });
    await act(async () => {
      callButtonSecondary.props.onPress();
    });

    expect(call).toHaveBeenCalledWith({
      number: '2222222222',
      prompt: false,
      skipCanOpen: true,
    });

    // Advance timers past countdown; primary contact should not be called
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(call).toHaveBeenCalledTimes(1);
  });

  it('stops countdown when manual SMS button is tapped', async () => {
    const contacts = [{name: 'Primary', phone: '+1 (555) 123-4567'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const smsButton = renderer.root.findByProps({testID: 'sms-button-0'});
    await act(async () => {
      smsButton.props.onPress();
    });

    // Advance timers past countdown; auto call should not be made
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(call).not.toHaveBeenCalled();
  });

  it('Add Contact and contact actions cannot be accessed while initial storage loading is pending', () => {
    AsyncStorage.getItem.mockReturnValueOnce(new Promise(() => {}));

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const root = renderer.root;
    expect(root.findByProps({testID: 'loading-indicator'})).toBeTruthy();
    expect(root.findAllByType(TouchableOpacity).length).toBe(0);
    expect(root.findAllByProps({testID: 'add-contact-button'}).length).toBe(0);
    expect(
      root.findAllByProps({testID: 'add-contact-inline-button'}).length,
    ).toBe(0);

    act(() => {
      renderer.unmount();
    });
  });

  it('opening Add Contact pauses active countdown and closing it resumes countdown', async () => {
    const contacts = [{name: 'Active User', phone: '+1234567890'}];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    // Advance 2s (countdown should be 3s remaining)
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(extractText(renderer.toJSON())).toContain('3');

    // Open Add Contact modal
    const inlineAddBtn = renderer.root.findByProps({
      testID: 'add-contact-inline-button',
    });
    act(() => {
      inlineAddBtn.props.onPress();
    });

    // Advance 5s while modal is open; countdown is paused, call is NOT triggered
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(call).not.toHaveBeenCalled();

    // Close modal via Cancel button
    const cancelBtn = renderer.root.findByProps({
      testID: 'modal-cancel-button',
    });
    act(() => {
      cancelBtn.props.onPress();
    });

    // Countdown resumes with remaining time (3s)
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(call).not.toHaveBeenCalled();

    // Advance 1 more second to reach 0
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(call).toHaveBeenCalledWith({
      number: '+1234567890',
      prompt: false,
      skipCanOpen: true,
    });
  });

  it('opening Add Contact while countdown is inactive does not start countdown when closed', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    // Open modal from empty state
    const addBtn = renderer.root.findByProps({testID: 'add-contact-button'});
    act(() => {
      addBtn.props.onPress();
    });

    // Close modal
    const cancelBtn = renderer.root.findByProps({
      testID: 'modal-cancel-button',
    });
    act(() => {
      cancelBtn.props.onPress();
    });

    // Advance timers; countdown should still be inactive
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(call).not.toHaveBeenCalled();
    expect(extractText(renderer.toJSON())).toContain('No Emergency Contacts');
  });

  it('stops countdown when Delete button is tapped', async () => {
    const contacts = [
      {name: 'Contact 1', phone: '1111111111'},
      {name: 'Contact 2', phone: '2222222222'},
    ];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(contacts));
    const alertSpy = jest.spyOn(Alert, 'alert');

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EmergencyCallingScreen navigation={mockNavigation} />,
      );
    });

    const deleteBtn = renderer.root.findByProps({testID: 'delete-button-0'});
    act(() => {
      deleteBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Remove Contact',
      'Remove Contact 1 from emergency contacts?',
      expect.any(Array),
    );

    // Advance timers past countdown; auto call should not be triggered
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(call).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
