import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';


const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const WeekDateSelector = ({ weekDates, selectedDate, onDateSelect }) => {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.weekDatesScroll}>
      {weekDates.map((date, index) => {
        const isSelected = selectedDate.toDateString() === date.toDateString();
        return (
          <TouchableOpacity
            key={index}
            style={styles.dateItem}
            onPress={() => onDateSelect(date)}>
            <Text
              style={[
                styles.dayText,
                { color: theme.text },
                isSelected && { color: theme.primary, fontWeight: 'bold' },
              ]}>
              {days[date.getDay()]}
            </Text>
            <Text
              style={[
                styles.dateText,
                { color: theme.text },
                isSelected && { color: theme.primary },
              ]}>
              {date.getDate()}
            </Text>
            {isSelected && (
              <View style={[styles.selectedDot, { backgroundColor: theme.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  weekDatesScroll: {
    flexDirection: 'row',
    marginBottom: 20,
    maxHeight: 70, 
  },
  dateItem: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  dayText: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginTop: 5,
  },
});

export default WeekDateSelector;
