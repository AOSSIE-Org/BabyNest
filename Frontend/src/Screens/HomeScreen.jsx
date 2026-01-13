import React from 'react';
import { View, Text } from 'react-native';
import { useHomeDashboard } from '../hooks/useHomeDashboard';

export default function HomeScreen() {
  const { week, dueDate } = useHomeDashboard();
  return (
    <View>
      <Text>Week {week}</Text>
      <Text>Due: {dueDate}</Text>
    </View>
  );
}
