import React, {useEffect} from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import {ThemeProvider, useTheme} from '../src/theme/ThemeContext';
import {AgentProvider, useAgentContext} from '../src/context/AgentContext';
import NotificationService from '../src/services/NotificationService';
import {getAgentContext} from '../src/storage/agent';

jest.mock('react-native-paper', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    Provider: ({children}) => <View>{children}</View>,
  };
});

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}) => <>{children}</>,
}));

jest.mock('../src/navigation/StackNavigator', () => 'StackNavigation');

jest.mock('react-native-toast-message', () => 'Toast');

jest.mock('../src/services/NotificationService', () => ({
  __esModule: true,
  default: {
    init: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('../src/storage/agent', () => ({
  getAgentContext: jest.fn(),
  taskRecommendations: jest.fn(),
  clearAllAgentContexts: jest.fn(() => true),
}));

describe('BabyNest app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue('42');
  });

  it('renders the app shell and initializes notifications', async () => {
    await act(async () => {
      renderer.create(<App />);
    });

    expect(NotificationService.init).toHaveBeenCalledTimes(1);
  });

  it('updates the active theme through ThemeProvider', async () => {
    const ThemeProbe = () => {
      const {theme, updateTheme} = useTheme();

      useEffect(() => {
        updateTheme('dark');
      }, []);

      return <Text>{theme.primary}</Text>;
    };

    let testRenderer;

    await act(async () => {
      testRenderer = renderer.create(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
    });

    expect(testRenderer.root.findByType(Text).props.children).toBe('#9e2a2b');
  });

  it('initializes agent context when the provider is mounted', async () => {
    getAgentContext.mockResolvedValue({
      success: true,
      data: {
        current_week: 18,
      },
    });

    const AgentProbe = () => {
      const {context, initializeContext, isInitialized} = useAgentContext();

      useEffect(() => {
        initializeContext();
      }, []);

      return (
        <Text>{`${String(isInitialized)}:${
          context?.current_week ?? 'none'
        }`}</Text>
      );
    };

    let testRenderer;

    await act(async () => {
      testRenderer = renderer.create(
        <AgentProvider>
          <AgentProbe />
        </AgentProvider>,
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('user_id');
    expect(getAgentContext).toHaveBeenCalledWith('42');
    expect(testRenderer.root.findByType(Text).props.children).toMatch(
      /true:18/,
    );
  });
});
