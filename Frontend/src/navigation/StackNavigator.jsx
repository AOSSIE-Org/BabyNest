import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnBoardingScreen from '../Screens/OnBoardingScreen';
import BasicDetailsScreen from '../Screens/BasicDetailsScreen';
import BottomTabs from './BottomTabNavigator';
import SOSAlertScreen from '../Screens/SOSAlertScreen';
import EmergencyCallingScreen from '../Screens/EmergencyCallingScreen';
import SettingsScreen from '../Screens/SettingsScreen';
import { SafeAreaView, View } from 'react-native';

const Stack = createStackNavigator();

export default function StackNavigation() {
  return (
    <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Onboarding" component={OnBoardingScreen} />
                <Stack.Screen name="BasicDetails" component={BasicDetailsScreen} />
                
                {/* Main App after onboarding */}
                <Stack.Screen name="MainTabs" component={BottomTabs} />
                <Stack.Screen name="SOSAlert" component={SOSAlertScreen} />
                <Stack.Screen name="EmergencyCalling" component={EmergencyCallingScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen}/>
                {/* Individual screens (like Chat) */}
                {/* <Stack.Screen name="ai" component={AI} /> */}
                </Stack.Navigator>
          </View>
  )
}