import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const timelineData = [
  { id: 1, week: 1, description: "The menstrual cycle begins with the shedding of the uterine lining, leading to menstruation.", status: "done" },
  { id: 2, week: 2, description: "Hormone levels start to rise, signaling the ovaries to prepare an egg for ovulation.", status: "done" },
  { id: 3, week: 3, description: "Ovulation occurs as a mature egg is released from the ovary, ready for fertilization.", status: "done" },
  { id: 4, week: 4, description: "If fertilization occurs, the fertilized egg travels through the fallopian tube towards the uterus.", status: "current" },
  { id: 5, week: 5, description: "The embryo implants into the uterus lining, beginning early stages of pregnancy.", status: "upcoming" },
  { id: 6, week: 6, description: "Pregnancy symptoms such as nausea, fatigue, and hormonal changes start to appear.", status: "upcoming" },
  { id: 7, week: 7, description: "The baby's heart begins to beat, and the circulatory system starts forming.", status: "upcoming" },
  { id: 8, week: 8, description: "Major organs such as the brain, lungs, and liver begin developing rapidly.", status: "upcoming" },
  { id: 9, week: 9, description: "The baby’s limbs start to develop, and tiny fingers and toes begin to form.", status: "upcoming" },
  { id: 10, week: 10, description: "Facial features like eyes, nose, and mouth become more distinct, giving the baby a more human-like appearance.", status: "upcoming" },
];

const TimelineScreen = ({ navigation }) => {
  const [timeline, setTimeline] = useState(timelineData);

  const markTaskAsDone = (taskId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedTimeline = timeline.map((task) => {
      if (task.id === taskId) return { ...task, status: "done" };
      if (task.status === "current") return { ...task, status: "upcoming" };
      return task;
    });
    const nextCurrentTaskIndex = updatedTimeline.findIndex((task) => task.status === "upcoming");
    if (nextCurrentTaskIndex !== -1) updatedTimeline[nextCurrentTaskIndex].status = "current";
    setTimeline(updatedTimeline);
  };

  const getTaskColor = (status) => {
    switch (status) {
      case "done": return "#87CEFA";
      case "current": return "#FFC0CB";
      case "upcoming": return "#F5F5F5";
      default: return "#F5F5F5";
    }
  };

  const getBarColor = (status) => {
    switch (status) {
      case "done": return "#87CEEB";
      case "current": return "#FFB6C1";
      case "upcoming": return "#D3D3D3";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timeline</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={timeline}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item, index }) => (
          <View style={styles.timelineContainer}>
            <View style={styles.timelineIndicator}>
              <View style={[styles.circle, { backgroundColor: getTaskColor(item.status) }]} />
              {index !== timeline.length - 1 && <View style={[styles.line, { backgroundColor: getBarColor(item.status) }]} />}
            </View>

            <View style={[styles.timelineItem, { backgroundColor: getTaskColor(item.status) }]}>  
              <Text style={styles.weekTitle}>Week {item.week}</Text>
              <Text style={styles.description}>{item.description}</Text>
              {item.status === "current" && (
                <TouchableOpacity style={styles.doneButton} onPress={() => markTaskAsDone(item.id)}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  timelineContainer: { flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 5 },
  timelineIndicator: { alignItems: "center", marginRight: 10 },
  circle: { marginTop:19, width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, minHeight: 50, marginVertical: 5 },
  timelineItem: { flex: 1, padding: 15, borderRadius: 15, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  weekTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  description: { fontSize: 14, color: "#666", marginTop: 5 },
  doneButton: { marginTop: 10, padding: 8, backgroundColor: "#ffffff", borderRadius: 8, alignItems: "center" },
  doneButtonText: { color: "#000000", fontSize: 14, fontWeight: "bold" },
});

export default TimelineScreen;
