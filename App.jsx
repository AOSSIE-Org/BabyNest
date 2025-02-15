import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialIcons";
import HomeScreen from "./src/Screens/HomeScreen";
import ChatScreen from "./src/Screens/ChatScreen";
import CalendarScreen from "./src/Screens/CalendarScreen";
import TimelineScreen from "./src/Screens/TimelineScreen";
import ProfileScreen from "./src/Screens/ProfileScreen";
import OnboardingScreen from "./src/Screens/OnBoardingScreen";  // Single onboarding component
import BasicDetailsScreen from "./src/Screens/BasicDetailsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ Bottom Tabs (Main Navigation After Onboarding)
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Calendar") iconName = "event";
          else if (route.name === "Messages") iconName = "chat";
          else if (route.name === "Profile") iconName = "person";

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ff4081",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Messages" component={TimelineScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ✅ Stack Navigator (Handles Onboarding & Main App)
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Onboarding */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        
        {/* Enter Basic Details */}
        <Stack.Screen name="BasicDetails" component={BasicDetailsScreen} />
        
        {/* Main App after onboarding */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />

        {/* Individual screens (like Chat) */}
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
