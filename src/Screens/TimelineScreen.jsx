import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";


const timelineData = [
  { week: 1, description: "This first week is actually your menstrual period Because your expected birth date (EDD or EDB) is calculated from the first day of your last period." },
  { week: 2, description: "This first week is actually your menstrual period Because your expected birth date (EDD or EDB) is calculated from the first day of your last period." },
  { week: 3, description: "This first week is actually your menstrual period Because your expected birth date (EDD or EDB) is calculated from the first day of your last period." },
  { week: 4, description: "This first week is actually your menstrual period Because your expected birth date (EDD or EDB) is calculated from the first day of your last period." },
  { week: 6, description: "This first week is actually your menstrual period Because your expected birth date (EDD or EDB) is calculated from the first day of your last period.", active: true },
  { week: 4, description: "This first week is actually your menstrual period Because your expected birth date (EDD or EDB) is calculated from the first day of your last period." },
  { week: 4, description: "This first week is actually your menstrual period Because your expected birth date (EDD or EDB) is calculated from the first day of your last period." },
];

const TimelineScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timeline</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Timeline List */}
      <FlatList
        data={timelineData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.timelineItem}>
            <View style={styles.timelineIndicator}>
              <View style={[styles.circle, item.active && styles.activeCircle]} />
              <View style={styles.line} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.weekTitle}>Week {item.week}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  timelineIndicator: {
    alignItems: "center",
    marginRight: 10,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFC0CB",
  },
  activeCircle: {
    backgroundColor: "#FF007F",
  },
  line: {
    width: 2,
    height: 50,
    backgroundColor: "#FFC0CB",
    marginVertical: 5,
  },
  textContainer: {
    flex: 1,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
});

export default TimelineScreen;
