// src/navigation/StackNavigator.jsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnBoardingScreen from '../Screens/OnBoardingScreen';
import BasicDetailsScreen from '../Screens/BasicDetailsScreen';
import BottomTabs from './BottomTabNavigator';
import SOSAlertScreen from '../Screens/SOSAlertScreen';
import EmergencyCallingScreen from '../Screens/EmergencyCallingScreen';
import SettingsScreen from '../Screens/SettingsScreen';

import CustomDrawer from '../Screens/CustomDrawer';
import HomeScreen from '../Screens/HomeScreen';
import WeightScreen from '../Screens/WeightScreen';
import MedicineScreen from '../Screens/MedicineScreen';
import SymptomsScreen from '../Screens/SymptomsScreen';
import DueDateScreen from '../Screens/DueDateScreen';
import DischargeScreen from '../Screens/DischargeScreen';
import BloodPressureScreen from '../Screens/BloodPressureScreen';
import AllTasksScreen from '../Screens/AllTasksScreen';

const Stack = createStackNavigator();

export default function StackNavigation() {
  return (
    <CustomDrawer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Optional onboarding screens */}
        <Stack.Screen name="Onboarding" component={OnBoardingScreen} />
        <Stack.Screen name="BasicDetails" component={BasicDetailsScreen} />
        <Stack.Screen name="DueDate" component={DueDateScreen} />

        {/* Main tabbed UI */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />

        {/* Additional screens */}
        <Stack.Screen name="SOSAlert" component={SOSAlertScreen} />
        <Stack.Screen name="EmergencyCalling" component={EmergencyCallingScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />

        {/* Drawer-accessible screens */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Weight" component={WeightScreen} />
        <Stack.Screen name="Medicine" component={MedicineScreen} />
        <Stack.Screen name="Symptoms" component={SymptomsScreen} />
        <Stack.Screen name="BloodPressure" component={BloodPressureScreen} />
        <Stack.Screen name="Discharge" component={DischargeScreen} />
        <Stack.Screen name="AllTasks" component={AllTasksScreen} />
      </Stack.Navigator>
    </CustomDrawer>
  );
}