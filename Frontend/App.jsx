import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialIcons";
import HomeScreen from "./src/Screens/HomeScreen";
import ChatScreen from "./src/Screens/ChatScreen";
import CalendarScreen from "./src/Screens/CalendarScreen";
import TimelineScreen from "./src/Screens/TimelineScreen";
import OnboardingScreen from "./src/Screens/OnBoardingScreen"; 
import BasicDetailsScreen from "./src/Screens/BasicDetailsScreen";
import { Provider as PaperProvider} from 'react-native-paper';
import SOSAlertScreen from "./src/Screens/SOSAlertScreen";
import EmergencyCallingScreen from "./src/Screens/EmergencyCallingScreen";
import SettingsScreen from "./src/Screens/SettingsScreen";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { SafeAreaView } from "react-native";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bottom Tabs (Main Navigation After Onboarding)
function BottomTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Calendar") iconName = "event";
          else if (route.name === "Timeline") iconName = "chat";
          else if (route.name === "Chat") iconName = "smart-toy";

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ff4081",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
}

// Stack Navigator (Handles Onboarding & Main App)
export default function App() {
  return (
      <PaperProvider>
        <ThemeProvider>
          <NavigationContainer>
          <SafeAreaView style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="BasicDetails" component={BasicDetailsScreen} />
              
              {/* Main App after onboarding */}
              <Stack.Screen name="MainTabs" component={BottomTabs} />
              <Stack.Screen name="SOSAlert" component={SOSAlertScreen} />
              <Stack.Screen name="EmergencyCalling" component={EmergencyCallingScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen}/>
              {/* Individual screens (like Chat) */}
              {/* <Stack.Screen name="ai" component={AI} /> */}
            </Stack.Navigator>
          </SafeAreaView>
          </NavigationContainer>
        </ThemeProvider>
      </PaperProvider >
  );
}