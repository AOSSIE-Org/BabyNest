import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';


const CalendarHeader = ({ selectedDate, onDateSelectorPress, onAddPress }) => {


  return (
    <View style={styles.header}>
      <Text style={[styles.headerText]}>
        {selectedDate.toLocaleString('default', { month: 'long' })}{' '}
        {selectedDate.getFullYear()}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={onDateSelectorPress}>
          <Icon
            name="calendar"
            size={24}
            color="#3D5A80"
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onAddPress}>
          <Icon
            name="add-outline"
            size={24}
            color="#3D5A80"
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D5A80',
  },
  icon: {
    marginRight: 10,
  },
});

export default CalendarHeader;
