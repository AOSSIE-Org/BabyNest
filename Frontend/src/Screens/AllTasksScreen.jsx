import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BASE_URL } from '@env';

export default function AllTasksScreen({ navigation, route }) {
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(route.params?.week || 1);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_tasks`);
      const data = await response.json();
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
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

  const getStatusColor = (status) => {
    return status === 'completed' ? '#4CAF50' : '#FF9800';
  };

  const filteredTasks = tasks
    .filter(task => {
      // Filter by week
      const weekMatch = task.starting_week <= currentWeek && task.ending_week >= currentWeek;
      
      // Filter by status
      if (filter === 'pending') return weekMatch && task.task_status === 'pending';
      if (filter === 'completed') return weekMatch && task.task_status === 'completed';
      return weekMatch;
    })
    .sort((a, b) => {
      // Sort by priority first, then by starting week
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const priorityDiff = priorityOrder[b.task_priority] - priorityOrder[a.task_priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.starting_week - b.starting_week;
    });

  const renderTask = (task) => (
    <View key={task.id} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={styles.taskBadges}>
          <View style={[styles.badge, { backgroundColor: getPriorityColor(task.task_priority) }]}>
            <Text style={styles.badgeText}>{task.task_priority}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(task.task_status) }]}>
            <Text style={styles.badgeText}>{task.task_status}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.taskContent}>
        {task.content}
      </Text>
      
      <View style={styles.taskFooter}>
        <Text style={styles.taskWeeks}>
          Week {task.starting_week} - {task.ending_week}
        </Text>
        {task.isOptional && (
          <View style={[styles.badge, { backgroundColor: '#9C27B0' }]}>
            <Text style={styles.badgeText}>Optional</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
        onPress={() => setFilter('all')}
      >
        <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
          All ({filteredTasks.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, filter === 'pending' && styles.activeFilterButton]}
        onPress={() => setFilter('pending')}
      >
        <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
          Pending ({filteredTasks.filter(t => t.task_status === 'pending').length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, filter === 'completed' && styles.activeFilterButton]}
        onPress={() => setFilter('completed')}
      >
        <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
          Completed ({filteredTasks.filter(t => t.task_status === 'completed').length})
        </Text>
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
        showsVerticalScrollIndicator={false}
      >
        {/* Week Selector */}
        <View style={styles.weekSelector}>
          <Text style={styles.weekLabel}>Select Week:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({ length: 40 }, (_, i) => i + 1).map((week) => (
              <TouchableOpacity
                key={week}
                style={[styles.weekButton, currentWeek === week && styles.activeWeekButton]}
                onPress={() => setCurrentWeek(week)}
              >
                <Text style={[styles.weekButtonText, currentWeek === week && styles.activeWeekButtonText]}>
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
                  : `No ${filter} tasks for week ${currentWeek}`
                }
              </Text>
            </View>
          ) : (
            <View style={styles.tasksContainer}>
              {filteredTasks.map(renderTask)}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  weekSelector: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  weekButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activeWeekButton: {
    backgroundColor: '#007AFF',
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeWeekButtonText: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  tasksSection: {
    paddingHorizontal: 20,
  },
  tasksContainer: {
    gap: 10,
  },
  taskCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  taskContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskWeeks: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
}); 