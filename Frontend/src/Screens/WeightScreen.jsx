import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useWeight } from '../hooks/useWeight';
import { formatLocalDate } from '../utils/dateUtils';

export default function WeightScreen() {
  const { history } = useWeight();

  return (
    <ScrollView>
      {history.map(item => (
        <View key={item.id}>
          <Text>Week {item.week_number}</Text>
          <Text>{item.weight} kg</Text>
          <Text>{formatLocalDate(item.created_at)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
