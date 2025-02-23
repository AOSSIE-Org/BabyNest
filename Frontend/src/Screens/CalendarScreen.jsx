import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, Animated, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Modal } from "react-native-paper";

const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const appointments = [
  { id:1, title: "Client Feedback Call", time: "08:00 - 8:15", start: 8, end: 9.25, color: "#FDE68A" },
  { id:2, title: "Product Team Call", time: "10:15 - 11:15", start: 10.25, end: 11.25, color: "#BFDBFE" },
  { id:3, title: "Design Standup Call", time: "12:00 - 13:00", start: 12, end: 13, color: "#FECACA" },
  { id:4, title: "Product Vision Planning", time: "14:30 - 15:15", start: 14.5, end: 15.25, color: "#D1FAE5" }
];

const generateWeekDates = (startDate) => {
  let weekDates = [];
  for (let i = 0; i < 7; i++) {
    let date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
};

const ScheduleScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(generateWeekDates(new Date()));
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isAddAppointmentModalVisible, setAddAppointmentModalVisible] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({title: "", start: 8.00, end: 9.00});

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  const showCalendar = () => setCalendarVisible(true);
  const hideCalendar = () => setCalendarVisible(false);
  const showAddAppointmentModal = () => setAddAppointmentModalVisible(true);
  const hideAddAppointmentModal = () => setAddAppointmentModalVisible(false);

  const handleDateConfirm = (date) => {
    setSelectedDate(date);
    setWeekDates(generateWeekDates(date));
    hideCalendar();
  };

  const handleAppointment = (appt) => {
      setModalOpen(true);
      setSelectedAppointment(appt);
  };

  const closeModals = () => {
    setModalOpen(false);
    setAddAppointmentModalVisible(false);
  }

  const timeSlotHeight = 80;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {selectedDate.toLocaleString('default', { month: 'long' })} {selectedDate.getFullYear()}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={showCalendar}>
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

      <ScrollView ref={scrollRef} style={styles.scheduleContainer}>
        <View style={styles.scheduleList}>
          {Array.from({ length: 13 }, (_, i) => 8 + i).map((hour) => (
            <View key={hour} style={[styles.scheduleItem, { height: timeSlotHeight }]}>
              <Text style={styles.timeText}>{hour}:00</Text>
              <View style={styles.scheduleLine} />
            </View>
          ))}
        </View>

        {appointments.map((appt, index) => (
          <View
            key={appt.id}
            style={{
              ...styles.appointment,
              backgroundColor: appt.color,
              top: (appt.start - 8) * timeSlotHeight,
              height: (appt.end - appt.start) * timeSlotHeight,
              zIndex: 1
            }}>
            <TouchableOpacity onPress={() => handleAppointment(appt)}>
              <Text style={styles.apptTitle}>{appt.title}</Text>
              <Text style={styles.apptTime}>{appt.time}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      
      <Modal visible={isModalOpen || isAddAppointmentModalVisible} onDismiss={() => setModalOpen(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>{(isModalOpen ? "Edit appointment" : "Add an appointment")}</Text>
          <TextInput placeholder={selectedAppointment.title} style={styles.modalApp} rr/>
          <TextInput placeholder={selectedAppointment.start.toString()} style={styles.modalApp} keyboardType="numeric" />
          <TextInput placeholder={selectedAppointment.end.toString()} style={styles.modalApp} keyboardType="numeric" />
          
          <View style={{ flexDirection: "row",gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
            <TouchableOpacity onPress={closeModals}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeModals}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isCalendarVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideCalendar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F8F8", 
    padding: 20, 
    paddingTop: 40 
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20 
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
