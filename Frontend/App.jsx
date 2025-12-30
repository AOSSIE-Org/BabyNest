import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AgentProvider } from './src/context/AgentContext';
import StackNavigation from './src/navigation/StackNavigator';
import { initNotifications } from './src/services/notification-service';

export default function App() {

  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <PaperProvider>
      <ThemeProvider>
        <AgentProvider>
          <NavigationContainer>
            <StackNavigation />
          </NavigationContainer>
        </AgentProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}