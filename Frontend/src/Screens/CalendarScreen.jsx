import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, Animated, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from 'react-native-toast-message';
import { Modal } from "react-native-paper";
import { BASE_URL } from '@env';

const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const colors = ["#FDE68A", "#BFDBFE", "#FECACA", "#D1FAE5"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const generateWeekDates = (startDate) => {
  let weekDates = [];
  for (let i = 0; i < 7; i++) {
    let date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
};

const changeDateFormat = (date) => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day} ${months[month - 1]}, ${year}`;
};

const ScheduleScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(generateWeekDates(new Date()));
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isAddAppointmentModalVisible, setAddAppointmentModalVisible] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({ title: "", start: 8.00, end: 9.00 });
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [isDateSelectorVisible, setDateSelectorVisible] = useState(false);
  const [isEditAppointmentModalVisible, setEditAppointmentModalVisible] = useState(false);
  const [editAppointment, setEditAppointment] = useState({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    fetchAppointments();
  }, []);


  const fetchAppointments = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/get_appointments`);
      const data = await response.json();

      if (JSON.stringify(data) !== JSON.stringify(appointments)) {
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAppointments();
  };

  const handleDateConfirm = (date) => {
    if (date < new Date()) {
      alert("Please select a future date and time.");
      return;
    }

    let appointmentTime = "";
    const appointmentDate = date.toISOString().split("T")[0];
    if(!isDateSelectorVisible){
      appointmentTime = date.toTimeString().split(" ")[0].slice(0, 5);
    }

    setNewAppointment((prevState) => ({
      ...prevState,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
    }));

    setEditAppointment((prevState) => ({
      ...prevState,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
    }));

    setWeekDates(generateWeekDates(date));
    setSelectedDate(date);
    hideCalendar();
    setDateSelectorVisible(false);
  };

  const addAppointment = async () => {
    try {
      console.log("New Appointment:", newAppointment);
      const response = await fetch(`${BASE_URL}/add_appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppointment),
      });

      const data = await response.json();
      if (response.ok) {
        closeModals();
        console.log("Success", "Appointment created successfully!");
        setAddAppointmentModalVisible(false);
        setNewAppointment({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
        fetchAppointments();

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
  };

  const handleDeleteAppointment = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/delete_appointment/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Appointment deleted successfully!",
          visibilityTime: 1000,
          position: "bottom",
        });
        fetchAppointments();
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
        text1: "Error deleting appointment!",
        visibilityTime: 1000,
        position: "bottom",
      });
      console.error("Error deleting appointment:", error);
    } finally {
      setModalOpen(false);
    }
  };

  const handleEditAppointment = (appt) => {
    setEditAppointmentModalVisible(true);
    setEditAppointment(appt);
  };

  const handleSaveEditAppointment = async () => {
    try {
      const response = await fetch(`${BASE_URL}/update_appointment/${editAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify(editAppointment),
      });
      const data = await response.json();
      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Appointment updated successfully!",
          visibilityTime: 1000,  
          position: "bottom",
        });
        fetchAppointments();
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
        text1: "Error updating appointment!",  
        visibilityTime: 1000,  
        position: "bottom",
      });
      console.error("Error updating appointment:", error);
    } finally {
      setEditAppointmentModalVisible(false);
      setEditAppointment({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
    }
  };
      
  const to_min = (str) => {
    const [hours, minutes] = str.split(":");
    return parseInt(hours) * 60 + parseInt(minutes.split(" ")[0]);
  };

  const showCalendar = () => setCalendarVisible(true);
  const hideCalendar = () => setCalendarVisible(false);
  const showAddAppointmentModal = () => setAddAppointmentModalVisible(true);
  const hideAddAppointmentModal = () => {
    setAddAppointmentModalVisible(false);
    setNewAppointment({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
  }

  const handleAppointment = (appt) => {
    setModalOpen(true);
    setSelectedAppointment(appt);
  };

  const closeModals = () => {
    setAddAppointmentModalVisible(false);
    setNewAppointment({ title: "", content: "", appointment_date: "", appointment_time: "", appointment_location: "" });
  }

  // Filter appointments based on selected date
  const filteredAppointments = appointments.filter((appt) => {
    const apptDate = new Date(appt.appointment_date);
    apptDate.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return apptDate.getTime() === selected.getTime();
  });

  const timeSlotHeight = 80;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {selectedDate.toLocaleString('default', { month: 'long' })} {selectedDate.getFullYear()}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => setDateSelectorVisible(true)}>
            <Icon name="calendar" size={24} color="#3D5A80" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={showAddAppointmentModal}>
            <Icon name="add-outline" size={24} color="#3D5A80" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDatesScroll}>
        {weekDates.map((date, index) => (
          <TouchableOpacity key={index} style={styles.dateItem} onPress={() => setSelectedDate(date)}>
            <Text style={[styles.dayText, selectedDate.getDate() === date.getDate() && styles.selectedText]}>
              {days[date.getDay()]}
            </Text>
            <Text style={[styles.dateText, selectedDate.getDate() === date.getDate() && styles.selectedText]}>
              {date.getDate()}
            </Text>
            {selectedDate.getDate() === date.getDate() && <View style={styles.selectedDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scheduleContainer} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
        <View style={styles.scheduleList}>
          {Array.from({ length: 13 }, (_, i) => 8 + i).map((hour) => (
            <View key={hour} style={[styles.scheduleItem, { height: timeSlotHeight }]}>
              <Text style={styles.timeText}>{hour}:00</Text>
              <View style={styles.scheduleLine} />
            </View>
          ))}
        </View>

        {filteredAppointments.map((appt, index) => (
          <View
            key={appt.id}
            style={{
              ...styles.appointment,
              backgroundColor: colors[index % colors.length],
              top: (to_min(appt.appointment_time) - 370),
              zIndex: 1
            }}>
            <TouchableOpacity onPress={() => handleAppointment(appt)}>
              <Text style={styles.apptTitle}>{appt.title}</Text>
              <Text style={styles.apptTime}>{appt.time}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={isAddAppointmentModalVisible} onDismiss={hideAddAppointmentModal} contentContainerStyle={styles.modal}>
        <Text style={styles.modalTitle}>{"Add an appointment"}</Text>
        <TextInput
          placeholder="Title"
          placeholderTextColor="black"
          style={styles.modalApp}
          value={newAppointment.title}
          onChangeText={(text) => setNewAppointment({ ...newAppointment, title: text })}
        />
        <TextInput
          placeholder="Description"
          placeholderTextColor="black"
          style={[styles.modalApp, styles.descriptionInput]}
          value={newAppointment.content}
          onChangeText={(text) => setNewAppointment({ ...newAppointment, content: text })}
        />
        <TouchableOpacity onPress={showCalendar}>
          <TextInput
            placeholder="Select Date"
            placeholderTextColor="black"
            style={styles.modalApp}
            editable={false}
            value={newAppointment.appointment_date}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={showCalendar}>
          <TextInput
            placeholder="Select Time"
            placeholderTextColor="black"
            style={styles.modalApp}
            editable={false}
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
          <TouchableOpacity onPress={addAppointment}>
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

      <DateTimePickerModal
        isVisible={isDateSelectorVisible}
        mode="date"
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setDateSelectorVisible(false)}
      />

      <Modal visible={isModalOpen} onDismiss={() => setModalOpen(false)} contentContainerStyle={styles.modal}>
        <Text style={styles.modalTitle}>{selectedAppointment.title}</Text>
        <Text style={styles.modalContent}>{selectedAppointment.content}</Text>
        <Text style={styles.modalDate}>{changeDateFormat(selectedAppointment.appointment_date)}</Text>
        <Text>{selectedAppointment.time}</Text>
        <Text style={styles.modalLocation}>{selectedAppointment.appointment_location}</Text>
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
          <TouchableOpacity onPress={() => handleEditAppointment(selectedAppointment)}> 
            <Text style={styles.modalSaveButton}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteAppointment(selectedAppointment.id)}>
            <Text style={styles.modalCancelButton}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={isEditAppointmentModalVisible} onDismiss={() => setEditAppointmentModalVisible(false)} contentContainerStyle={styles.modal}>
        <Text style={styles.modalTitle}>{"Edit appointment"}</Text>
        <TextInput
          placeholder="Title"
          placeholderTextColor="black"
          style={styles.modalApp}
          value={editAppointment.title}
          onChangeText={(text) => setEditAppointment({ ...editAppointment, title: text })}
        />
        <TextInput
          placeholder="Description"
          placeholderTextColor="black"          
          style={[styles.modalApp, styles.descriptionInput]}
          value={editAppointment.content}
          onChangeText={(text) => setEditAppointment({ ...editAppointment, content: text })}
        />
        <TouchableOpacity onPress={showCalendar}>
          <TextInput
            placeholder="Select Date"
            placeholderTextColor="black"
            style={styles.modalApp}
            editable={false}            
            value={editAppointment.appointment_date}
          />
        </TouchableOpacity> 

        <TouchableOpacity onPress={showCalendar}>
          <TextInput
            placeholder="Select Time"            
            placeholderTextColor="black"
            style={styles.modalApp}
            editable={false}
            value={editAppointment.appointment_time}            
          />
        </TouchableOpacity>

        <TextInput
          placeholder="Location"
          placeholderTextColor="black"          
          style={styles.modalApp}
          value={editAppointment.appointment_location}
          onChangeText={(text) => setEditAppointment({ ...editAppointment, appointment_location: text })}
        />
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
          <TouchableOpacity onPress={handleSaveEditAppointment}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity> 
          <TouchableOpacity onPress={() => setEditAppointmentModalVisible(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    //backgroundColor: "#F8F8F8",
    padding: 10, 
    marginHorizontal: 20,
    paddingTop: 40 
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20, 
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  headerText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#3D5A80" 
  },
  icon: { 
    marginRight: 10
  },
  weekDatesScroll: { 
    flexDirection: "row", 
    marginBottom: 20 
  },
  dateItem: { 
    alignItems: "center", 
    marginHorizontal: 15 
  },
  dayText: { 
    fontSize: 14, 
    color: "#3D5A80" 
  },
  dateText: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#3D5A80" 
  },
  selectedText: { 
    color: "#FF6B6B" 
  },
  selectedDot: { 
    width: 5, 
    height: 5, 
    backgroundColor: "#FF6B6B", 
    borderRadius: 5, 
    marginTop: 5 
  },
  scheduleContainer: { 
    flex: 1, 
    marginTop: -500 
  },
  scheduleList: { 
    flex: 1, 
    paddingVertical: 10 
  },
  scheduleItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderBottomWidth: 1, 
    borderBottomColor: "#ddd" 
  },
  timeText: { 
    width: 50, 
    fontSize: 14,
    color: "#3D5A80" 

  },
  scheduleLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: "#ddd" 

  },
  appointment: { 
    position: "absolute", 
    left: 60, 
    right: 20, 
    borderRadius: 10, 
    padding: 15, 
    elevation: 3 

  },
  apptTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#3D5A80" 

  },
  apptTime: { 
    fontSize: 14, 
    color: "#6B7280" 
  },
  modal:{
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
    color: "#333",
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
  }
});

export default ScheduleScreen;
