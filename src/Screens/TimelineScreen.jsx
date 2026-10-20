import React, {useState, useEffect, useRef} from 'react';
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
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Modal} from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addTask,
  getTasks,
  moveTaskToAppointment,
  updateTask,
} from '../storage/tasks';
import AddTaskModal from '../Components/AddTaskModal';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const TimelineScreen = ({navigation}) => {
  const flatListRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState({
    id: '',
    title: '',
    content: '',
  });
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    content: '',
    appointment_date: '',
    appointment_time: '',
    appointment_location: '',
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user_id, setUser_id] = useState(null);
  const [addTaskVisible, setAddTaskVisible] = useState(false);

  const setUserId = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    setUser_id(userId);
  };

  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const userId = await AsyncStorage.getItem('user_id');
      const getTasks_res = await getTasks(userId);
      if (!getTasks_res.success) {
        throw new Error(getTasks_res.error.message);
      }
      const data = await getTasks_res.data;
      console.log('Raw Data from Backend:', data);

      // Correctly extract data from the response
      const formattedData = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.content,
        week_start: task.starting_week,
        week_end: task.ending_week,
        priority: task.task_priority,
        isOptional: task.isOptional,
        status: task.task_status,
        isAppointmentMade: task.isAppointmentMade,
      }));

      formattedData.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        if (a.status === 'completed' && b.status === 'completed')
          return a.week_start - b.week_start;
        else {
          if (a.isAppointmentMade === 1 && b.isAppointmentMade !== 1) return -1;
          if (a.isAppointmentMade !== 1 && b.isAppointmentMade === 1) return 1;
          else {
            if (a.priority === b.priority) return a.week_start - b.week_start;
            return b.priority - a.priority;
          }
        }
        return a.week_start - b.week_start;
      });

      setTasks(formattedData);

      // Find the index of the first non-completed task and scroll to it
      const firstPendingIndex = formattedData.findIndex(
        task => task.status !== 'completed',
      );
      if (firstPendingIndex !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToIndex({
            index: firstPendingIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setUserId();
    fetchTasks();
  }, []);

  const handleRefresh = () => {
    fetchTasks();
  };

  const markTaskAsDone = async taskId => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    try {
      const updateTask_res = await updateTask(user_id, taskId, {
        task_status: 'completed',
      });

      if (updateTask_res.success) {
        console.log('Success', 'Task marked as done!');
        const updatedTasks = tasks.map(task =>
          task.id === taskId ? {...task, status: 'completed'} : task,
        );
        setTasks(updatedTasks);
      } else {
        throw new Error(updateTask_res.error.message);
      }
    } catch (error) {
      console.log('Error', error.message);
    }
    fetchTasks();
  };

  const makeappointment = async () => {
    try {
      const moveTaskToAppointment_res = await moveTaskToAppointment(
        user_id,
        newAppointment.task_id,
        newAppointment,
      );

      if (moveTaskToAppointment_res.success) {
        setModalVisible(false);
        console.log('Success', 'Appointment created successfully!');
        setModalVisible(false);
        setNewAppointment({
          title: '',
          content: '',
          appointment_date: '',
          appointment_time: '',
          appointment_location: '',
        });
        fetchTasks();

        Toast.show({
          type: 'success',
          text1: 'Appointment added successfully!',
          visibilityTime: 1000,
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'error',
          text1:
            moveTaskToAppointment_res.error.message || 'Something went wrong!',
          visibilityTime: 1000,
          position: 'bottom',
        });
        console.log(moveTaskToAppointment_res.error.message);
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
    }

    fetchTasks();
  };

  const hideAddAppointmentModal = () => {
    setModalVisible(false);
    setNewAppointment({
      title: '',
      content: '',
      appointment_date: '',
      appointment_time: '',
      appointment_location: '',
    });
  };

  const hideCalendar = () => setIsCalendarVisible(false);

  const handleDateConfirm = date => {
    if (date < new Date()) {
      Alert.alert('Please select a future date and time.');
      return;
    }

    const appointmentDate = date.toISOString().split('T')[0];
    const appointmentTime = date.toTimeString().split(' ')[0].slice(0, 5);

    setNewAppointment({
      ...newAppointment,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      task_id: selectedTask.id,
    });

    hideCalendar();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity
          style={styles.addTaskButton}
          onPress={() => setAddTaskVisible(true)}>
          <Ionicons name="add" size={20} />
          <Text style={styles.addTaskButtonText}>Add task</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#DA4F7A"
          style={{marginTop: 50}}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={tasks}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#DA4F7A"
            />
          }
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
          renderItem={({item, index}) => {
            const completed = item.status === 'completed';

            return (
              <View style={styles.timelineContainer}>
                {/* Timeline */}
                <View style={styles.timelineIndicator}>
                  <View
                    style={[styles.circle, completed && styles.completedCircle]}
                  />

                  {index !== tasks.length - 1 && (
                    <View
                      style={[styles.line, completed && styles.completedLine]}
                    />
                  )}
                </View>

                {/* Task */}
                <View
                  style={[
                    styles.timelineItem,
                    completed && styles.completedItem,
                  ]}>
                  {/* Header */}
                  <View style={styles.taskHeader}>
                    <View style={styles.titleContainer}>
                      <Text
                        style={[
                          styles.title,
                          completed && styles.completedTitle,
                        ]}>
                        {item.title}
                      </Text>

                      {item.isOptional === 1 && (
                        <View style={styles.optionalBadge}>
                          <Text style={styles.optionalText}>Optional</Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        completed ? styles.completedBadge : styles.pendingBadge,
                      ]}>
                      <Text
                        style={[
                          styles.statusText,
                          completed
                            ? styles.completedStatusText
                            : styles.pendingStatusText,
                        ]}>
                        {completed ? 'Done' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {!!item.description && (
                    <Text
                      style={[
                        styles.description,
                        completed && styles.completedDescription,
                      ]}
                      numberOfLines={3}>
                      {item.description}
                    </Text>
                  )}

                  {/* Meta */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      Week {item.week_start}
                      {item.week_end !== item.week_start
                        ? `–${item.week_end}`
                        : ''}
                    </Text>

                    <View style={styles.metaDot} />

                    <Text style={styles.metaText}>
                      {item.priority} priority
                    </Text>
                  </View>

                  {/* Actions */}
                  {!completed && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.completeButton}
                        activeOpacity={0.8}
                        onPress={() => markTaskAsDone(item.id)}>
                        <Text style={styles.completeButtonText}>Complete</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={item.isAppointmentMade === 1}
                        style={[
                          styles.appointmentButton,
                          item.isAppointmentMade === 1 && styles.disabledButton,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          const taskDetails = {
                            id: item.id,
                            title: item.title,
                            content: item.description,
                          };

                          setSelectedTask(taskDetails);

                          setNewAppointment({
                            ...newAppointment,
                            title: item.title,
                            content: item.description,
                            task_id: selectedTask.id,
                          });

                          setModalVisible(true);
                        }}>
                        <Text
                          style={[
                            styles.appointmentButtonText,
                            item.isAppointmentMade === 1 &&
                              styles.disabledButtonText,
                          ]}>
                          {item.isAppointmentMade === 1
                            ? 'Appointment added'
                            : 'Add appointment'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* SET TO APPOINTMENY MODAL */}
      <Modal
        visible={modalVisible}
        onDismiss={hideAddAppointmentModal}
        contentContainerStyle={styles.modal}>
        <Text style={styles.modalTitle}>New appointment</Text>
        <Text style={styles.modalSubtitle}>
          Add a date and time for this task.
        </Text>

        {/* Appointment title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Title</Text>

          <TextInput
            placeholder="Appointment title"
            placeholderTextColor="#9A9397"
            style={styles.input}
            value={newAppointment.title}
            onChangeText={text =>
              setNewAppointment({
                ...newAppointment,
                title: text,
              })
            }
          />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Notes</Text>

          <TextInput
            placeholder="Add notes"
            placeholderTextColor="#9A9397"
            style={[styles.input, styles.notesInput]}
            multiline
            numberOfLines={3}
            value={newAppointment.content}
            onChangeText={text =>
              setNewAppointment({
                ...newAppointment,
                content: text,
              })
            }
          />
        </View>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Date</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCalendarVisible(true)}>
              <View style={styles.selectInput}>
                <Text
                  style={[
                    styles.selectText,
                    !newAppointment.appointment_date && styles.placeholderText,
                  ]}>
                  {newAppointment.appointment_date || 'Select date'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Time</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCalendarVisible(true)}>
              <View style={styles.selectInput}>
                <Text
                  style={[
                    styles.selectText,
                    !newAppointment.appointment_time && styles.placeholderText,
                  ]}>
                  {newAppointment.appointment_time || 'Select time'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Location</Text>

          <TextInput
            placeholder="Clinic, hospital, or other location"
            placeholderTextColor="#9A9397"
            style={styles.input}
            value={newAppointment.appointment_location}
            onChangeText={text =>
              setNewAppointment({
                ...newAppointment,
                appointment_location: text,
              })
            }
          />
        </View>

        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={hideAddAppointmentModal}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.8}
            onPress={makeappointment}>
            <Text style={styles.saveButtonText}>Save appointment</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ADD TASKS MODAL */}
      <AddTaskModal
        visible={addTaskVisible}
        userId={user_id}
        addTask={addTask}
        onClose={() => setAddTaskVisible(false)}
        onTaskAdded={() => {
          getTasks(user_id);
        }}
      />

      <DateTimePickerModal
        isVisible={isCalendarVisible}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={hideCalendar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', paddingHorizontal: 20},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#292529',
  },

  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },

  addTaskButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  taskList: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 24,
  },

  timelineContainer: {
    flexDirection: 'row',
  },

  timelineIndicator: {
    width: 10,
    alignItems: 'center',
  },

  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DA4F7A',
    marginTop: 18,
    zIndex: 2,
  },

  completedCircle: {
    backgroundColor: '#72B89A',
  },

  line: {
    width: 1,
    flex: 1,
    backgroundColor: '#E8DDE1',
    marginTop: 2,
  },

  completedLine: {
    backgroundColor: '#CFE4DA',
  },

  timelineItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    marginLeft: 8,

    borderWidth: 1,
    borderColor: '#F0E8EB',
  },

  completedItem: {
    backgroundColor: '#FAFAFA',
    borderColor: '#EEEEEE',
  },

  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262326',
    lineHeight: 22,
  },

  completedTitle: {
    color: '#777777',
  },

  optionalBadge: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#F4EAF0',
  },

  optionalText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8A6173',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  pendingBadge: {
    backgroundColor: '#FFF0F4',
  },

  completedBadge: {
    backgroundColor: '#EAF6F0',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  pendingStatusText: {
    color: '#C13F68',
  },

  completedStatusText: {
    color: '#4D9474',
  },

  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#686168',
  },

  completedDescription: {
    color: '#888888',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  metaText: {
    fontSize: 11,
    color: '#888188',
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#BDB6BA',
    marginHorizontal: 8,
  },

  actions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },

  completeButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: '#DA4F7A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  appointmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: '#FFF5F8',
    borderWidth: 1,
    borderColor: '#F0CBD8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  appointmentButtonText: {
    color: '#B83F66',
    fontSize: 12,
    fontWeight: '600',
  },

  disabledButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E8E8E8',
  },

  disabledButtonText: {
    color: '#999999',
    textAlign: 'center',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    borderRadius: 18,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#272327',
  },

  modalSubtitle: {
    fontSize: 12,
    color: '#81797E',
    marginTop: 4,
    marginBottom: 20,
  },

  field: {
    marginBottom: 14,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#554D52',
    marginBottom: 6,
  },

  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E8E1E4',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#292529',
    backgroundColor: '#FFFFFF',
  },

  notesInput: {
    minHeight: 72,
    paddingTop: 11,
    textAlignVertical: 'top',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  halfField: {
    flex: 1,
  },

  selectInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E8E1E4',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  selectText: {
    fontSize: 13,
    color: '#292529',
  },

  placeholderText: {
    color: '#9A9397',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },

  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F4F5',
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#686166',
  },

  saveButton: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DA4F7A',
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TimelineScreen;
