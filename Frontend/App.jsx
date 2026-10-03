import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import {ThemeProvider} from './src/theme/ThemeContext';
import {AgentProvider} from './src/context/AgentContext';
import StackNavigation from './src/navigation/StackNavigator';
import Toast from 'react-native-toast-message';
import NotificationService from './src/services/NotificationService';

export default function App() {
  const [currentRouteName, setCurrentRouteName] = useState('Home');
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await NotificationService.init();
      } catch (error) {
        console.error('App Failed to initialize notifications:', error);
      }
    };
    initNotifications();
  }, []);

  return (
    <PaperProvider>
      <ThemeProvider>
        <AgentProvider>
          <NavigationContainer
            onStateChange={state => {
              const route = state?.routes?.[state.index];

              if (route?.name === 'MainTabs') {
                const nestedRoute = route.state?.routes?.[route.state.index];

                setCurrentRouteName(nestedRoute?.name ?? 'Home');
              } else {
                setCurrentRouteName(route?.name ?? 'Home');
              }
            }}>
            <StackNavigation currentRouteName={currentRouteName} />
          </NavigationContainer>
          <Toast />
        </AgentProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
