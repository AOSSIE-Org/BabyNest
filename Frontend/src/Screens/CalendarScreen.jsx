import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';
import { addAppointment, deleteAppointment, getAppointments, updateAppointment } from '../storage/appointments';

const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const colors = ['#FDE68A', '#BFDBFE', '#FECACA', '#D1FAE5'];
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const generateWeekDates = startDate => {
  let weekDates = [];
  for (let i = 0; i < 7; i++) {
    let date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
};

const timeSlotHeight = 80;

const changeDateFormat = date => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day} ${months[month - 1]}, ${year}`;
};

const ScheduleScreen = ({route}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [user_id, setUserId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(generateWeekDates(new Date()));
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isAddAppointmentModalVisible, setAddAppointmentModalVisible] =
    useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({
    title: '',
    start: 8.0,
    end: 9.0,
  });
  const scrollViewRef = useRef(null);

  // Fetch user id from local storage
  const getUserId = async () => {
    const id = await AsyncStorage.getItem('user_id');
    setUserId(id);
    return id;
  };

  
  // Fetch appointments on first load
  useEffect(() => {
    getUserId();
    fetchAppointments();
  }, []);
  
  useEffect(() => {
    getUserId();
    const getAppointmentY = time => {
      return ((to_min(time) - 60) / 60) * timeSlotHeight;
    };

    const appointment_date = route.params?.appointment_date;
    const appointment_time = route.params?.appointment_time;

    if (appointment_time) {
      const appointmentY = getAppointmentY(appointment_time);
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, appointmentY - 200),
        animated: true,
      });
    }

    setSelectedDate(appointment_date ? new Date(appointment_date) : new Date());
    setWeekDates(
      generateWeekDates(
        appointment_date ? new Date(appointment_date) : new Date(),
      ),
    );

    return () => {
      setSelectedDate(new Date());
      setWeekDates(generateWeekDates(new Date()));
    };
  }, [route.params?.appointment_date, route.params?.appointment_time]);


  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    content: '',
    appointment_date: '',
    appointment_time: '',
    appointment_location: '',
    user_id: user_id,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isDateSelectorVisible, setDateSelectorVisible] = useState(false);
  const [isEditAppointmentModalVisible, setEditAppointmentModalVisible] =
    useState(false);
  const [editAppointment, setEditAppointment] = useState({
    title: '',
    content: '',
    appointment_date: '',
    appointment_time: '',
    appointment_location: '',
    user_id: user_id,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);


  const fetchAppointments = async () => {
    try {
      const user_id = await getUserId();
      setRefreshing(true);
      const appointments_response = await getAppointments(user_id);
      const data = appointments_response.data;
      if (!appointments_response.success) {
        throw new Error(appointments_response.error.message);
      }

      if (JSON.stringify(data) !== JSON.stringify(appointments)) {
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAppointments();
  };

  const handleDateConfirm = date => {
    if (date < new Date()) {
      alert('Please select a future date and time.');
      hideCalendar();
      setDateSelectorVisible(false);
      return;
    }

    let appointmentTime = '';
    const appointmentDate = date.toISOString().split('T')[0];
    if (!isDateSelectorVisible) {
      appointmentTime = date.toTimeString().split(' ')[0].slice(0, 5);
    }

    setNewAppointment(prevState => ({
      ...prevState,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
    }));

    setEditAppointment(prevState => ({
      ...prevState,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
    }));

    setWeekDates(generateWeekDates(date));
    setSelectedDate(date);
    hideCalendar();
    setDateSelectorVisible(false);
  };

  const addAppointmentHandler = async () => {
    try {
      setNewAppointment(prevState => ({
        ...prevState,
        user_id: user_id,
      }));
      const add_appointment_res = await addAppointment(newAppointment);
      
      closeModals();
      setAddAppointmentModalVisible(false);
      if (!add_appointment_res.success) {
        throw new Error(add_appointment_res.error.message);
      }

      if (add_appointment_res.success) {
        console.log('Success', 'Appointment created successfully!');
        setNewAppointment({
          title: '',
          content: '',
          appointment_date: '',
          appointment_time: '',
          appointment_location: '',
          user_id: user_id,
        });
        fetchAppointments();

        Toast.show({
          type: 'success',
          text1: 'Appointment added successfully!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        
      } 
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Error adding appointment!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      console.error('Error adding appointment:', error.message);
    }
  };

  const handleDeleteAppointment = async id => {
    try {

      const delete_appointment_res = await deleteAppointment(id, user_id);
      if (delete_appointment_res.success) {
        Toast.show({
          type: 'success',
          text1: 'Appointment deleted successfully!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        fetchAppointments();
      } else {
        Toast.show({
          type: 'error',
          text1: delete_appointment_res.error.message || 'Something went wrong!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        console.log('Error', delete_appointment_res.error.message || 'Something went wrong!');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error deleting appointment!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      console.error('Error deleting appointment:', error);
    } finally {
      setModalOpen(false);
    }
  };

  const handleEditAppointment = appt => {
    setEditAppointmentModalVisible(true);
    setEditAppointment(appt);
  };

  const handleSaveEditAppointment = async () => {
    try {
      const update_appointment_res = await updateAppointment(editAppointment.id, editAppointment);
      const data = update_appointment_res.data;
      if (update_appointment_res.success) {
        Toast.show({
          type: 'success',
          text1: 'Appointment updated successfully!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: update_appointment_res.error.message || 'Something went wrong!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        console.log('Error', data.error || 'Something went wrong!');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error updating appointment!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      console.error('Error updating appointment:', error);
    } finally {
      setEditAppointmentModalVisible(false);
      setEditAppointment({
        title: '',
        content: '',
        appointment_date: '',
        appointment_time: '',
        appointment_location: '',
        user_id: user_id,
      });
    }
  };

  const to_min = str => {
    const [hours, minutes] = str.split(':');
    return parseInt(hours) * 60 + parseInt(minutes.split(' ')[0]);
  };

  const showCalendar = () => {
    setCalendarVisible(true);
  };
  const hideCalendar = () => setCalendarVisible(false);
  const showAddAppointmentModal = () => setAddAppointmentModalVisible(true);
  const hideAddAppointmentModal = () => {
    setAddAppointmentModalVisible(false);
    setNewAppointment({
      title: '',
      content: '',
      appointment_date: '',
      appointment_time: '',
      appointment_location: '',
      user_id: user_id,
    });
  };

  const handleAppointment = appt => {
    setModalOpen(true);
    setSelectedAppointment(appt);
  };

  const closeModals = () => {
    setAddAppointmentModalVisible(false);
    setNewAppointment({
      title: '',
      content: '',
      appointment_date: '',
      appointment_time: '',
      appointment_location: '',
      user_id: user_id,
    });
  };

  // Filter appointments based on selected date
  const filteredAppointments = appointments.filter(appt => {
    const apptDate = new Date(appt.appointment_date);
    apptDate.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return apptDate.getTime() === selected.getTime();
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {selectedDate.toLocaleString('default', {month: 'long'})}{' '}
          {selectedDate.getFullYear()}
        </Text>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity onPress={() => setDateSelectorVisible(true)}>
            <Icon
              name="calendar"
              size={24}
              color="#3D5A80"
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={showAddAppointmentModal}>
            <Icon
              name="add-outline"
              size={24}
              color="#3D5A80"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekDatesScroll}>
        {weekDates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dateItem}
            onPress={() => setSelectedDate(date)}>
            <Text
              style={[
                styles.dayText,
                selectedDate.getDate() === date.getDate() &&
                  styles.selectedText,
              ]}>
              {days[date.getDay()]}
            </Text>
            <Text
              style={[
                styles.dateText,
                selectedDate.getDate() === date.getDate() &&
                  styles.selectedText,
              ]}>
              {date.getDate()}
            </Text>
            {selectedDate.getDate() === date.getDate() && (
              <View style={styles.selectedDot} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scheduleContainer}
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <View style={styles.scheduleList}>
          {Array.from({length: 24}, (_, i) => 1 + i).map(hour => (
            <View
              key={hour}
              style={[styles.scheduleItem, {height: timeSlotHeight}]}>
              <Text style={styles.timeText}>{hour == 24 ? '00' : hour}:00</Text>
              <View style={styles.scheduleLine} />
            </View>
          ))}
        </View>

        {filteredAppointments.map((appt, index) => (
          <View
            key={appt.id}
            id={`${appt.time}`}
            style={{
              ...styles.appointment,
              backgroundColor: colors[index % colors.length],
              top: ((to_min(appt.appointment_time) - 60) / 60) * timeSlotHeight,
              zIndex: 1,
            }}>
            <TouchableOpacity onPress={() => handleAppointment(appt)}>
              <Text style={styles.apptTitle}>{appt.title}</Text>
              <Text style={styles.apptTime}>{appt.time}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={isAddAppointmentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={hideAddAppointmentModal}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideAddAppointmentModal}
              accessibilityLabel="Close modal">
              <Icon name="close" size={18} color="#E91E63" />
            </TouchableOpacity>

            {/* Decorative Top */}
            <View style={styles.iconContainer}>
              <View style={styles.topBadge} />
              <View style={styles.sparkle} />
            </View>

            {/* Header */}
            <Text style={styles.title}>Add an Appointment</Text>

            <Text style={styles.subtitle}>
              Fill in the details below to schedule your appointment
            </Text>

            <ScrollView
              style={styles.formContainer}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              nestedScrollEnabled>
              {/* Title */}
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Appointment title"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={newAppointment.title}
                  onChangeText={text =>
                    setNewAppointment({
                      ...newAppointment,
                      title: text,
                    })
                  }
                  returnKeyType="next"
                />
              </View>

              {/* Description */}
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Description"
                  placeholderTextColor="#999"
                  style={[styles.input, styles.descriptionInput]}
                  value={newAppointment.content}
                  onChangeText={text =>
                    setNewAppointment({
                      ...newAppointment,
                      content: text,
                    })
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Date */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={showCalendar}
                style={styles.inputWrapper}>
                <TextInput
                  placeholder="Select date"
                  placeholderTextColor="#999"
                  style={styles.input}
                  editable={false}
                  pointerEvents="none"
                  value={newAppointment.appointment_date}
                />
              </TouchableOpacity>

              {/* Time */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={showCalendar}
                style={styles.inputWrapper}>
                <TextInput
                  placeholder="Select time"
                  placeholderTextColor="#999"
                  style={styles.input}
                  editable={false}
                  pointerEvents="none"
                  value={newAppointment.appointment_time}
                />
              </TouchableOpacity>

              {/* Location */}
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Location"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={newAppointment.appointment_location}
                  onChangeText={text =>
                    setNewAppointment({
                      ...newAppointment,
                      appointment_location: text,
                    })
                  }
                  returnKeyType="done"
                />
              </View>

              {/* Extra bottom space so last field can scroll above keyboard */}
              <View style={{height: 20}} />
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={addAppointmentHandler}
                activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>Save Appointment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={hideAddAppointmentModal}
                activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Decorative Bottom */}
            <View style={styles.decorativeBottom} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={{zIndex: 9999, elevation: 10}}>
        <DateTimePickerModal
          isVisible={isCalendarVisible}
          mode="datetime"
          minimumDate={new Date()}
          onConfirm={handleDateConfirm}
          onCancel={hideCalendar}
        />
      </View>

      <DateTimePickerModal
        isVisible={isDateSelectorVisible}
        mode="date"
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setDateSelectorVisible(false)}
      />

      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedAppointment.title}
              </Text>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalOpen(false)}
                activeOpacity={0.7}>
                <Icon name="close" size={18} color="#E91E63" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description</Text>

              <Text style={styles.modalContentdesc}>
                {selectedAppointment.content}
              </Text>
            </View>

            {/* Appointment Information */}
            <View style={styles.infoContainer}>
              {/* Date */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Icon name="calendar-outline" size={18} color="#E91E63" />
                </View>

                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Date</Text>

                  <Text style={styles.modalDate}>
                    {changeDateFormat(selectedAppointment.appointment_date)}
                  </Text>
                </View>
              </View>

              {/* Time */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Icon name="time-outline" size={18} color="#E91E63" />
                </View>

                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Time</Text>

                  <Text style={styles.modalTime}>
                    {selectedAppointment.appointment_time}
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Icon name="location-outline" size={18} color="#E91E63" />
                </View>

                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Location</Text>

                  <Text style={styles.modalLocation}>
                    {selectedAppointment.appointment_location}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.8}
                onPress={() => {
                  setModalOpen(false);
                  handleEditAppointment(selectedAppointment);
                }}>
                <Icon name="create-outline" size={18} color="#E91E63" />

                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                activeOpacity={0.8}
                onPress={() => {
                  handleDeleteAppointment(selectedAppointment.id);
                  setModalOpen(false);
                }}>
                <Icon name="trash-outline" size={18} color="#fff" />

                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom decoration */}
            <View style={styles.modalBottomLine} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditAppointmentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditAppointmentModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{'Edit appointment'}</Text>
            <TextInput
              placeholder="Title"
              placeholderTextColor="black"
              style={styles.modalApp}
              value={editAppointment.title}
              onChangeText={text =>
                setEditAppointment({...editAppointment, title: text})
              }
            />
            <TextInput
              placeholder="Description"
              placeholderTextColor="black"
              style={[styles.modalApp, styles.descriptionInput]}
              value={editAppointment.content}
              onChangeText={text =>
                setEditAppointment({...editAppointment, content: text})
              }
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
              onChangeText={text =>
                setEditAppointment({
                  ...editAppointment,
                  appointment_location: text,
                })
              }
            />
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 10,
              }}>
              <TouchableOpacity onPress={handleSaveEditAppointment}>
                <Text style={styles.modalSaveButton}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditAppointmentModalVisible(false)}>
                <Text style={styles.modalCancelButton}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingTop: 40,
  },
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
  weekDatesScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dateItem: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  dayText: {
    fontSize: 14,
    color: '#3D5A80',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D5A80',
  },
  selectedText: {
    color: '#FF6B6B',
  },
  selectedDot: {
    width: 5,
    height: 5,
    backgroundColor: '#FF6B6B',
    borderRadius: 5,
    marginTop: 5,
  },
  scheduleContainer: {
    flex: 1,
    marginTop: -500,
  },
  scheduleList: {
    flex: 1,
    paddingVertical: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  timeText: {
    width: 50,
    fontSize: 14,
    color: '#3D5A80',
  },
  scheduleLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  appointment: {
    position: 'absolute',
    left: 60,
    right: 20,
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  apptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D5A80',
  },
  apptTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  modal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 26,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    marginBottom: 20,
    paddingRight: 4,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#000',
    lineHeight: 31,
    paddingRight: 15,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  descriptionContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  modalContentdesc: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  infoContainer: {
    marginBottom: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
    fontWeight: '600',
  },
  modalDate: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  modalTime: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  modalLocation: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  deleteButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#E91E63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F8BBD0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: '#E91E63',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBottomLine: {
    height: 3,
    borderRadius: 50,
    backgroundColor: '#F8BBD0',
    marginTop: 22,
  },
  modalApp: {
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 8,
  },
  modalSaveButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 5,
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  modalCancelButton: {
    backgroundColor: '#ff4081',
    padding: 10,
    borderRadius: 5,
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    maxHeight: '95%',
    flexShrink: 1,
    borderRadius: 24,
    padding: 24,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,

    width: 34,
    height: 34,
    borderRadius: 17,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#f5f5f5',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  decorativeIcon: {
    fontSize: 48,
  },
  topBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCE4EC',
    marginBottom: 8,
  },
  sparkle: {
    width: 8,
    height: 8,
    backgroundColor: '#F8BBD0',
    borderRadius: 4,
    marginTop: -8,
    marginLeft: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    // color: '#E91E63',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9E3A57',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  formContainer: {
    flexGrow: 0,
    flexShrink: 1,
    width: '100%',
  },
  formContentContainer: {
    paddingTop: 2,
    paddingBottom: 10,
  },
  inputWrapper: {
    marginBottom: 14,
    width: '100%',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 50,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#fff',
  },
  descriptionInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  backgroundColor: '#fff',
  padding: 10,
  borderRadius: 5,
  borderWidth: 1,
  // borderColor: '#F8BBD0',
  textAlign: 'center',
  marginTop: 10,
  buttonContainer: {
    gap: 10,
    marginTop: 4,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#E91E63',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F8BBD0',
  },
});

export default ScheduleScreen;
