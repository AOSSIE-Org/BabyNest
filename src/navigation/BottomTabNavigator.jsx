import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HomeScreen from '../Screens/HomeScreen';
import ChatScreen from '../Screens/ChatScreen';
import CalendarScreen from '../Screens/CalendarScreen';
import TimelineScreen from '../Screens/TimelineScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
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