import React, { useState, useEffect,useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
  TextInput,
  Button,
  Alert,
  RefreshControl,
  SafeAreaView
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Modal } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from 'react-native-toast-message';
import { BASE_URL } from '@env';

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const TimelineScreen = ({ navigation }) => {
  const flatListRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState({ id: "", title: "", content: "" });
  const [newAppointment, setNewAppointment] = useState({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/get_tasks`);
      const data = await response.json();
      console.log("Raw Data from Backend:", data);

      // Correctly extract data from the response
      const formattedData = data.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.content,
        week_start: task.starting_week,
        week_end: task.ending_week,
        priority: task.task_priority,
        isOptional: task.isOptional,
        status: task.task_status,
        isAppointmentMade: task.isAppointmentMade
      }));

      formattedData.sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return -1;
        if (a.status !== "completed" && b.status === "completed") return 1;
        if (a.status === "completed" && b.status === "completed") return a.week_start - b.week_start;
        else{
          if(a.isAppointmentMade === 1 && b.isAppointmentMade !== 1) return -1;
          if(a.isAppointmentMade !== 1 && b.isAppointmentMade === 1) return 1;
          else{
            if(a.priority === b.priority) return a.week_start - b.week_start;
            return b.priority - a.priority;
          }
        }
        return a.week_start - b.week_start;
      });

      setTasks(formattedData);
      
      // Find the index of the first non-completed task and scroll to it
      const firstPendingIndex = formattedData.findIndex(task => task.status !== "completed");
      if (firstPendingIndex !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToIndex({ index: firstPendingIndex, animated: true, viewPosition: 0.5 });
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRefresh = () => {
    fetchTasks();
  }
  
  const markTaskAsDone = async (taskId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    try {
      console.log(taskId);
      const response = await fetch(`${BASE_URL}/update_task/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_status: "completed" }),
      });
      const data = await response.json();

      if (response.status === 200) {
        console.log("Success", "Task marked as done!");
        const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: "completed" } : task));
        setTasks(updatedTasks);
      } else {
        console.log("Error", data.error || "Something went wrong!");
      }
    } catch (error) {
      console.log("Error", error.message);
    }
    fetchTasks();
  }

  const makeappointment = async () => {
    try {
      console.log("New Appointment:", newAppointment);
      const response = await fetch(`${BASE_URL}/move_to_appointment/${newAppointment.task_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppointment),
      });

      const data = await response.json();
      if (response.ok) {
        setModalVisible(false);
        console.log("Success", "Appointment created successfully!");
        setModalVisible(false);
        setNewAppointment({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
        fetchTasks();

        Toast.show({
          type: "success",
          text1: "Appointment added successfully!",
          visibilityTime: 1000,
          position: "bottom",
        });
      } else {
        Toast.show({
          type: "error",
          text1: data.error || "Something went wrong!",
          visibilityTime: 1000,
          position: "bottom",
        });
        console.log("Error", data.error || "Something went wrong!");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error adding appointment!",
        visibilityTime: 1000,
        position: "bottom",
      });
      console.error("Error adding appointment:", error);
    }

    fetchTasks();
  };

  const hideAddAppointmentModal = () => {
    setModalVisible(false);
    setNewAppointment({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
  }

  const hideCalendar = () => setIsCalendarVisible(false);

  const handleDateConfirm = (date) => {
    if (date < new Date()) {
      Alert.alert("Please select a future date and time.");
      return;
    }

    const appointmentDate = date.toISOString().split("T")[0];
    const appointmentTime = date.toTimeString().split(" ")[0].slice(0, 5);

    setNewAppointment({
      ...newAppointment,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      task_id: selectedTask.id
    });

    hideCalendar();
  };

  const getTaskColor = (status) => {
    return status === "completed" ? "#87CEFA" : "#FFC0CB"; // Blue for completed, Pink for pending
  };

  const getBarColor = (status) => {
    return status === "completed" ? "#87CEEB" : "#FFB6C1"; // Blue for completed, Light Pink for pending
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF4081" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ref={flatListRef}
          data={tasks}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <View style={styles.timelineContainer}>
              <View style={styles.timelineIndicator}>
                <View style={[styles.circle, { backgroundColor: getTaskColor(item.status) }]} />
                {index !== tasks.length - 1 && <View style={[styles.line, { backgroundColor: getBarColor(item.status) }]} />}
              </View>

              <View style={[styles.timelineItem, { backgroundColor: getTaskColor(item.status) }]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.title}>{item.title}</Text>
                  {item.isOptional === 1 && <Ionicons name="star" size={8} color="purple" style={{ marginLeft: 5 }} />}
                </View>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.details}>📅 Week {item.week_start} - Week {item.week_end}</Text>
                <Text style={styles.details}> Priority : {item.priority}</Text>

                {item.status === "pending" && (
                  <View>
                    <TouchableOpacity style={styles.doneButton} onPress={() => markTaskAsDone(item.id)}>
                      <Text style={styles.doneButtonText}>Mark as Done</Text>
                    </TouchableOpacity>

                    <TouchableOpacity disabled={item.isAppointmentMade === 1}
                      style={[styles.doneButton, item.isAppointmentMade === 1 ? styles.disabledButton : {}]}
                      onPress={() => {
                        const taskDetails = { id: item.id, title: item.title, content: item.description };
                        setSelectedTask(taskDetails);
                        setNewAppointment({ ...newAppointment, title: item.title, content: item.description });
                        setModalVisible(true);
                      }}
                      pointerEvents={item.isAppointmentMade === 1 ? "none" : "auto"}
                    >
                      <Text style={styles.doneButtonText}>{item.isAppointmentMade === 1 ? "Appointment made" : "Make an Appointment"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} onDismiss={hideAddAppointmentModal} contentContainerStyle={styles.modal}>
        <Text style={styles.modalTitle}>{"Make an appointment"}</Text>
        <TextInput
          placeholder={selectedTask.title}
          placeholderTextColor="black"
          style={styles.modalApp}
          value={newAppointment.title}
          onChangeText={(text) => setNewAppointment({ ...newAppointment, title: text })}
        />
        <TextInput
          placeholder={selectedTask.content}
          placeholderTextColor="black"
          style={[styles.modalApp]}
          value={newAppointment.content}
          onChangeText={(text) => setNewAppointment({ ...newAppointment, content: text })}
        />
        <TouchableOpacity onPress={() => setIsCalendarVisible(true)}>
          <TextInput
            placeholder="Select Date"
            placeholderTextColor="black"
            style={styles.modalApp}
            editable={false}
            value={newAppointment.appointment_date}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsCalendarVisible(true)}>
          <TextInput
            placeholder="Select Time"
            placeholderTextColor="black"
            editable={false}
            style={styles.modalApp}
            value={newAppointment.appointment_time}

          />
        </TouchableOpacity>

        <TextInput
          placeholder="Location"
          placeholderTextColor="black"
          style={styles.modalApp}
          value={newAppointment.appointment_location}
          onChangeText={(text) => setNewAppointment({ ...newAppointment, appointment_location: text })}
        />

        <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
          <TouchableOpacity onPress={makeappointment}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={hideAddAppointmentModal}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isCalendarVisible}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={hideCalendar}
      />
    </SafeAreaView>

  )
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 20  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  timelineContainer: { flexDirection: "row", justifyContent: 'center', alignItems: "center", width: "95%", marginVertical: 5, marginHorizontal: 5 },
  timelineIndicator: { alignItems: "center", marginRight: 10 },
  disabledButton: {
    color: "#d3d3d3", 
    opacity: 0.6, 
  },  
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    width: "80%",
    alignSelf: "center",
    borderRadius: 10,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  modalApp: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 8
  },
  modalSaveButton: {
    backgroundColor: "#ff4081",
    padding: 10,
    borderRadius: 5,
    color: "white",
    textAlign: "center",
    marginTop: 10
  },
  modalCancelButton: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    color: "gray",
    textAlign: "center",
    marginTop: 10
  },
  circle: { marginTop: 19, width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, minHeight: 50, marginVertical: 5 },
  timelineItem: { flex: 1, padding: 15, borderRadius: 15, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 16, fontWeight: "bold", color: "#333" },
  description: { fontSize: 14, color: "#666", marginTop: 5 },
  details: { fontSize: 12, color: "#888", marginTop: 2 },
  doneButton: { marginTop: 10, padding: 8, backgroundColor: "#ffffff", borderRadius: 8, alignItems: "center" },
  doneButtonText: { color: "#000000", fontSize: 14, fontWeight: "bold" },
});

export default TimelineScreen;


