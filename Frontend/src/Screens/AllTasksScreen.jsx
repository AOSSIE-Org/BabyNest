import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {deleteTask, getTasks, updateTask} from '../storage/tasks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import {Button, TextInput} from 'react-native-paper';

export default function AllTasksScreen({navigation, route}) {
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(route.params?.week || 1);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [user_id, setUser_id] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editVisible, setEditVisible] = useState(false);

  const fetchTasks = async userId => {
    try {
      const getTasks_res = await getTasks(userId);
      if (!getTasks_res.success) {
        throw new Error(getTasks_res.error.message);
      }
      const data = getTasks_res.data;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');

        console.log('userid:', userId);

        setUser_id(userId);

        if (!userId) {
          console.log('No user ID found');
          return;
        }

        await fetchTasks(userId);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks(user_id);
    setRefreshing(false);
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FFA726';
      case 'low':
        return '#66BB6A';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusColor = status => {
    return status === 'completed' ? '#4CAF50' : '#FF9800';
  };

  const handleDeleteTask = async id => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this entry?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deleteTask_res = await deleteTask(user_id, id);

              if (!deleteTask_res.success) {
                Toast.show({
                  type: 'error',
                  text1: deleteTask_res.error.message || 'Error deleting task!',
                  visibilityTime: 2000,
                  position: 'bottom',
                  topOffset: 50,
                });
                throw new Error(deleteTask_res.error.message);
              }

              Toast.show({
                type: 'success',
                text1: 'Task deleted successfully!',
                visibilityTime: 2000,
                position: 'bottom',
                topOffset: 50,
              });

              getTasks(user_id);
            } catch (error) {
              console.log('Delete task Error:', error);
            }
          },
        },
      ],
    );
  };

  const handleUpdateTask = async () => {
    try {
      const data = {
        title: editingTask.title,
        content: editingTask.content,
        starting_week: Number(editingTask.starting_week),
        ending_week: Number(editingTask.ending_week),
        task_priority: editingTask.task_priority,
        task_status: editingTask.task_status,
        isOptional: editingTask.isOptional,
      };

      const response = await updateTask(user_id, editingTask.id, data);

      if (!response.success) {
        Toast.show({
          type: 'error',
          text1: response.error.message || 'Error updating task!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(response.error?.message || 'Failed to update task');
      }

      // Update the task in your current list
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                ...data,
              }
            : task,
        ),
      );

      setEditVisible(false);
      setEditingTask(null);

      Toast.show({
        type: 'success',
        text1: 'Task updated successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
    } catch (error) {
      console.error('Update task error:', error);

      Alert.alert('Error', error.message || 'Failed to update task');
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      // Filter by week
      const weekMatch =
        task.starting_week <= currentWeek && task.ending_week >= currentWeek;

      // Filter by status
      if (filter === 'pending')
        return weekMatch && task.task_status === 'pending';
      if (filter === 'completed')
        return weekMatch && task.task_status === 'completed';
      return weekMatch;
    })
    .sort((a, b) => {
      // Sort by priority first, then by starting week
      const priorityOrder = {high: 3, medium: 2, low: 1};
      const priorityDiff =
        priorityOrder[b.task_priority] - priorityOrder[a.task_priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.starting_week - b.starting_week;
    });

  const renderTask = task => (
    <View key={task.id} style={styles.taskCard}>
      <View
        style={[
          styles.taskAccent,
          {backgroundColor: getPriorityColor(task.task_priority)},
        ]}
      />

      <View style={styles.taskInner}>
        {/* Header */}
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleContainer}>
            <View style={styles.taskIconContainer}>
              <Icon
                name={
                  task.task_status === 'completed'
                    ? 'check-circle'
                    : 'assignment'
                }
                size={20}
                color={
                  task.task_status === 'completed'
                    ? '#27AE60'
                    : 'rgb(218,79,122)'
                }
              />
            </View>

            <Text style={styles.taskTitle}>{task.title}</Text>
          </View>

          <View style={styles.taskActions}>
            {/* Update */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setEditingTask({...task});
                setEditVisible(true);
              }}
              style={styles.editButton}>
              <Icon name="edit" size={19} color="#4A90E2" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleDeleteTask(task.id)}
              style={styles.deleteButton}>
              <Icon name="delete-outline" size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.taskBadges}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: getPriorityColor(task.task_priority),
              },
            ]}>
            <Text style={styles.badgeText}>{task.task_priority}</Text>
          </View>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: getStatusColor(task.task_status),
              },
            ]}>
            <Text style={styles.badgeText}>{task.task_status}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.taskContent}>{task.content}</Text>

        <View style={styles.taskDivider} />

        {/* Footer */}
        <View style={styles.taskFooter}>
          <View style={styles.weekInfo}>
            <Icon name="date-range" size={16} color="#888" />

            <Text style={styles.taskWeeks}>
              Week {task.starting_week} - {task.ending_week}
            </Text>
          </View>

          {task.isOptional && (
            <View style={styles.optionalBadge}>
              <Icon name="info-outline" size={13} color="#9C27B0" />
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.filterButton,
          filter === 'all' && styles.activeFilterButton,
        ]}
        onPress={() => setFilter('all')}>
        <Icon
          name="list"
          size={17}
          color={filter === 'all' ? '#fff' : '#777'}
        />

        <Text
          style={[
            styles.filterText,
            filter === 'all' && styles.activeFilterText,
          ]}>
          All
        </Text>

        <View
          style={[
            styles.filterCount,
            filter === 'all' && styles.activeFilterCount,
          ]}>
          <Text
            style={[
              styles.filterCountText,
              filter === 'all' && styles.activeFilterCountText,
            ]}>
            {filteredTasks.length}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.filterButton,
          filter === 'pending' && styles.activeFilterButton,
        ]}
        onPress={() => setFilter('pending')}>
        <Icon
          name="schedule"
          size={17}
          color={filter === 'pending' ? '#fff' : '#777'}
        />

        <Text
          style={[
            styles.filterText,
            filter === 'pending' && styles.activeFilterText,
          ]}>
          Pending
        </Text>

        <View
          style={[
            styles.filterCount,
            filter === 'pending' && styles.activeFilterCount,
          ]}>
          <Text
            style={[
              styles.filterCountText,
              filter === 'pending' && styles.activeFilterCountText,
            ]}>
            {filteredTasks.filter(t => t.task_status === 'pending').length}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.filterButton,
          filter === 'completed' && styles.activeFilterButton,
        ]}
        onPress={() => setFilter('completed')}>
        <Icon
          name="check-circle-outline"
          size={17}
          color={filter === 'completed' ? '#fff' : '#777'}
        />

        <Text
          style={[
            styles.filterText,
            filter === 'completed' && styles.activeFilterText,
          ]}>
          Done
        </Text>

        <View
          style={[
            styles.filterCount,
            filter === 'completed' && styles.activeFilterCount,
          ]}>
          <Text
            style={[
              styles.filterCountText,
              filter === 'completed' && styles.activeFilterCountText,
            ]}>
            {filteredTasks.filter(t => t.task_status === 'completed').length}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Tasks - Week {currentWeek}</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Icon name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Week Selector */}
        <View style={styles.weekSelector}>
          <Text style={styles.weekLabel}>Select Week:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({length: 40}, (_, i) => i + 1).map(week => (
              <TouchableOpacity
                key={week}
                style={[
                  styles.weekButton,
                  currentWeek === week && styles.activeWeekButton,
                ]}
                onPress={() => setCurrentWeek(week)}>
                <Text
                  style={[
                    styles.weekButtonText,
                    currentWeek === week && styles.activeWeekButtonText,
                  ]}>
                  {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter Buttons */}
        {renderFilterButtons()}

        {/* Tasks */}
        <View style={styles.tasksSection}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="assignment" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? `No tasks for week ${currentWeek}`
                  : `No ${filter} tasks for week ${currentWeek}`}
              </Text>
            </View>
          ) : (
            <View style={styles.tasksContainer}>
              {filteredTasks.map(renderTask)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* edit tasks menu */}
      {editingTask && (
        <Modal
          visible={editVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Task</Text>

                <TouchableOpacity onPress={() => setEditVisible(false)}>
                  <Icon name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  label="Task Title"
                  value={editingTask.title}
                  onChangeText={text =>
                    setEditingTask({
                      ...editingTask,
                      title: text,
                    })
                  }
                  mode="outlined"
                  style={styles.input}
                  textColor="#454545"
                />

                <TextInput
                  label="Description"
                  value={editingTask.content}
                  onChangeText={text =>
                    setEditingTask({
                      ...editingTask,
                      content: text,
                    })
                  }
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  textColor="#454545"
                />

                <View style={styles.editRow}>
                  <TextInput
                    label="Starting Week"
                    value={String(editingTask.starting_week ?? '')}
                    onChangeText={text =>
                      setEditingTask({
                        ...editingTask,
                        starting_week: text,
                      })
                    }
                    keyboardType="numeric"
                    mode="outlined"
                    style={[styles.input, styles.editHalf]}
                    textColor="#454545"
                  />

                  <TextInput
                    label="Ending Week"
                    value={String(editingTask.ending_week ?? '')}
                    onChangeText={text =>
                      setEditingTask({
                        ...editingTask,
                        ending_week: text,
                      })
                    }
                    keyboardType="numeric"
                    mode="outlined"
                    style={[styles.input, styles.editHalf]}
                    textColor="#454545"
                  />
                </View>

                {/* Priority */}
                <Text style={styles.editLabel}>Priority</Text>

                <View style={styles.optionRow}>
                  {['low', 'medium', 'high'].map(item => (
                    <TouchableOpacity
                      key={item}
                      onPress={() =>
                        setEditingTask({
                          ...editingTask,
                          task_priority: item,
                        })
                      }
                      style={[
                        styles.optionButton,
                        editingTask.task_priority === item &&
                          styles.selectedOption,
                      ]}>
                      <Text
                        style={[
                          styles.optionText,
                          editingTask.task_priority === item &&
                            styles.selectedOptionText,
                        ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Status */}
                <Text style={styles.editLabel}>Status</Text>

                <View style={styles.optionRow}>
                  {['pending', 'completed'].map(item => (
                    <TouchableOpacity
                      key={item}
                      onPress={() =>
                        setEditingTask({
                          ...editingTask,
                          task_status: item,
                        })
                      }
                      style={[
                        styles.optionButton,
                        editingTask.task_status === item &&
                          styles.selectedOption,
                      ]}>
                      <Text
                        style={[
                          styles.optionText,
                          editingTask.task_status === item &&
                            styles.selectedOptionText,
                        ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Save */}
                <Button
                  mode="contained"
                  onPress={handleUpdateTask}
                  style={styles.saveButton}
                  buttonColor="rgb(218,79,122)">
                  <Text style={styles.selectedOptionText}> Save Changes</Text>
                </Button>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1E5E9',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#252525',
  },

  /* SCROLL */
  scrollView: {
    flex: 1,
  },

  /* WEEK SELECTOR */
  weekSelector: {
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
  },

  weekLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 13,
  },

  weekButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8F5F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderWidth: 1,
    borderColor: '#EEE5E8',
  },

  activeWeekButton: {
    backgroundColor: 'rgb(218,79,122)',
    borderColor: 'rgb(218,79,122)',
  },

  weekButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#777',
  },

  activeWeekButtonText: {
    color: '#fff',
  },

  /* FILTERS */
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 18,
    padding: 5,
    backgroundColor: '#F2ECEF',
    borderRadius: 16,
    gap: 5,
  },

  filterButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 7,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  activeFilterButton: {
    backgroundColor: 'rgb(218,79,122)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },

  activeFilterText: {
    color: '#fff',
  },

  filterCount: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4DDE0',
  },

  activeFilterCount: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
  },

  activeFilterCountText: {
    color: '#fff',
  },

  /* TASK SECTION */
  tasksSection: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  tasksContainer: {
    gap: 12,
  },

  /* TASK CARD */
  taskCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0E5E9',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  taskAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },

  taskInner: {
    padding: 16,
    paddingLeft: 18,
  },

  /* TASK HEADER */
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  taskTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 8,
  },

  taskIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  taskTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: '#252525',
    paddingTop: 5,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5FF',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F0',
    marginLeft: 8,
  },
  taskBadges: {
    alignItems: 'flex-start',
    gap: 5,
    flexDirection: 'row',
    marginBottom: '10',
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  /* DESCRIPTION */
  taskContent: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#707070',
    marginBottom: 8,
  },

  taskDivider: {
    height: 1,
    backgroundColor: '#F2ECEE',
    marginBottom: 12,
  },

  /* FOOTER */
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  taskWeeks: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },

  optionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F4E9F8',
  },

  optionalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9C27B0',
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 30,
  },

  emptyText: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  editModal: {
    backgroundColor: '#FFF5F8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 25,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
  },

  input: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },

  inputOutline: {
    borderRadius: 12,
  },

  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  editHalf: {
    flex: 1,
  },

  editLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    marginBottom: 10,
  },

  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  optionButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedOption: {
    backgroundColor: 'rgb(218,79,122)',
    borderColor: 'rgb(218,79,122)',
  },

  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textTransform: 'capitalize',
  },

  selectedOptionText: {
    color: '#FFFFFF',
  },

  saveButton: {
    marginTop: 8,
    marginBottom: 5,
    borderRadius: 12,
    paddingVertical: 4,
  },
});
