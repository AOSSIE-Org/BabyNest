import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const notes = [
    "Initial Prenatal Visit - Week 6-8",
    "First Trimester Screening - Week 10-13",
    "Anatomy Scan (Mid-Pregnancy Ultrasound) - Week 18-22",
    "Glucose Tolerance Test - Week 24-28",
    "Routine Check-ups - Every 4 weeks until Week 28, then every 2 weeks until Week 36, then weekly",
    "Group B Strep Test - Week 35-37"
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="menu" size={28} color="#333" />
        <Text style={styles.title}>Calendar</Text>
        <Icon name="add" size={28} color="#333" />
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: "#ff4081" } }}
          theme={{
            todayTextColor: "#ff4081",
            arrowColor: "#ff4081",
          }}
        />
      </View>

      {/* Notes */}
      <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Appointments</Text>
            <FlatList
            data={notes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
                <View style={styles.noteItem}>
                <View style={styles.bullet} />
                <Text style={styles.noteText}>{item}</Text>
                <MaterialIcons name="more-vert" size={20} color="#333" />
                </View>
            )}
            />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "bold" },
  calendarContainer: { borderRadius: 10, overflow: "hidden", backgroundColor: "#f5f5f5", padding: 10, marginBottom: 20 },
  notesContainer: { backgroundColor: "#fce4ec", padding: 15, borderRadius: 10 },
  notesTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  noteItem: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff4081", marginRight: 10 },
  noteText: { flex: 1, fontSize: 14 },
});

