import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider} from 'react-native-paper';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AgentProvider } from './src/context/AgentContext';
import StackNavigation from './src/navigation/StackNavigator';
import NotificationService from './src/services/NotificationService';

export default  function App() {

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
            <NavigationContainer>
              <StackNavigation />
            </NavigationContainer>
          </AgentProvider>
        </ThemeProvider>
      </PaperProvider >
  );
}
