import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {getTask} from '../storage/tasks';

const PINK = '#DA4F7A';

const TaskDetailsModal = ({visible, userId, taskId, onClose}) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !userId || !taskId) {
      setTask(null);
      setError('');
      return;
    }

    let cancelled = false;

    const fetchTask = async () => {
      setLoading(true);
      setError('');
      setTask(null);

      try {
        const result = await getTask(userId, taskId);

        if (cancelled) return;

        // Adapt this if your DB function returns a different shape.
        const fetchedTask = result?.data ?? result?.task ?? result;

        if (
          result?.success === false ||
          !fetchedTask ||
          Array.isArray(fetchedTask)
        ) {
          setError(result?.message || 'Task not found.');
          return;
        }

        setTask(fetchedTask);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch task:', err);
          setError('Unable to load task details. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTask();

    return () => {
      cancelled = true;
    };
  }, [visible, userId, taskId]);

  const priority = (task?.task_priority || 'low').toLowerCase();
  const status = (task?.task_status || 'pending').toLowerCase();

  const isCompleted = status === 'completed';
  const isOptional =
    task?.isOptional === true ||
    task?.isOptional === 1 ||
    task?.isOptional === '1';

  const appointmentMade =
    task?.isAppointmentMade === true ||
    task?.isAppointmentMade === 1 ||
    task?.isAppointmentMade === '1';

  const formatWeek = () => {
    if (!task) return '';

    const start = task.starting_week;
    const end = task.ending_week;

    return Number(end) && Number(end) !== Number(start)
      ? `Weeks ${start}–${end}`
      : `Week ${start}`;
  };

  const DetailRow = ({icon, label, value, color}) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={color || '#81777D'} />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>TASK DETAILS</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close task details">
              <Ionicons name="close" size={22} color="#51484D" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={PINK} />
              <Text style={styles.stateText}>Loading task...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Ionicons name="alert-circle-outline" size={32} color="#C13F68" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : task ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}>
                {/* Title and description */}
                <Text style={styles.taskTitle}>{task.title}</Text>

                {!!task.content?.trim() && (
                  <Text style={styles.description}>{task.content}</Text>
                )}

                {/* Status */}
                <View style={styles.badges}>
                  <View
                    style={[
                      styles.badge,
                      isCompleted ? styles.completedBadge : styles.pendingBadge,
                    ]}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isCompleted ? '#438767' : PINK,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: isCompleted ? '#438767' : '#B83F66',
                        },
                      ]}>
                      {isCompleted ? 'Completed' : 'Pending'}
                    </Text>
                  </View>

                  {isOptional && (
                    <View style={[styles.badge, styles.optionalBadge]}>
                      <Text style={styles.optionalText}>Optional</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* All task data */}
                <DetailRow
                  icon="calendar-outline"
                  label="Pregnancy timeline"
                  value={formatWeek()}
                />

                <DetailRow
                  icon="flag-outline"
                  label="Priority"
                  value={priority.charAt(0).toUpperCase() + priority.slice(1)}
                  color={
                    priority === 'high'
                      ? '#D45B63'
                      : priority === 'medium'
                      ? '#C58A35'
                      : '#648A79'
                  }
                />

                <DetailRow
                  icon="calendar-number-outline"
                  label="Appointment"
                  value={
                    appointmentMade ? 'Appointment added' : 'Not scheduled'
                  }
                  color={appointmentMade ? '#438767' : '#81777D'}
                />
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export default TaskDetailsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 20, 24, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerText: {
    gap: 3,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: PINK,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    paddingBottom: 12,
  },

  taskTitle: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 26,
    color: '#292529',
  },

  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#766D73',
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },

  pendingBadge: {
    backgroundColor: '#FFF0F4',
  },

  completedBadge: {
    backgroundColor: '#EAF5EF',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  optionalBadge: {
    backgroundColor: '#F3EFF8',
  },

  optionalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#80629C',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0E9EC',
    marginVertical: 18,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },

  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F8F5F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    color: '#8A8186',
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#393238',
  },

  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    gap: 12,
  },

  stateText: {
    fontSize: 13,
    color: '#81777D',
  },

  errorText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#C13F68',
  },

  closeText: {
    color: PINK,
    fontWeight: '600',
    padding: 8,
  },
});
