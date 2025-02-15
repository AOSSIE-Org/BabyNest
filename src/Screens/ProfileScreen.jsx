import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const ProfileScreen = () => {
  const notes = [
    "Eat foods high in fiber, and drink fluids",
    "Eat foods high in fiber, and drink fluids (particularly water) to avoid constipation.",
    "Eat foods high in fiber, and drink fluids",
    "Eat foods high in fiber, and drink fluids",
    "Eat foods high in fiber, and drink fluids (particularly water) to avoid constipation.",
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="menu" size={24} color="black" />
        <Text style={styles.headerTitle}>16th Week</Text>
        <Ionicons name="ellipsis-vertical" size={24} color="black" />
      </View>

      {/* Week Progress */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekScroll}
      >
        {[161, 162, 163, 164, 165, 166, 167].map((week, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.weekCircle, week === 164 && styles.activeWeek]}
          >
            <Text
              style={[styles.weekText, week === 164 && styles.activeWeekText]}
            >
              {week}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Baby Info */}
      <View style={styles.infoCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={30} color="#ff4081" />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Baby Weight</Text>
          <Text style={styles.infoValue}>110 gr</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Days Left</Text>
          <Text style={styles.infoValue}>168 days</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Baby Height</Text>
          <Text style={styles.infoValue}>50 cm</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Week Left</Text>
          <Text style={styles.infoValue}>16 Week</Text>
        </View>
      </View>

      {/* Notes Section */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Notes Created</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  // Week Progress
  weekScroll: {
    flexDirection: "row",
    marginBottom: 15,
    alignSelf: "center",
  },
  weekCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeWeek: {
    backgroundColor: "#ff4081",
  },
  weekText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "bold",
  },
  activeWeekText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Baby Info Card
  infoCard: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: "#555",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // Notes Section
  notesContainer: {
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 5,
    borderRadius: 5,
  },
  bullet: {
    width: 8,
    height: 8,
    backgroundColor: "#ff4081",
    borderRadius: 4,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
});

export default ProfileScreen;
