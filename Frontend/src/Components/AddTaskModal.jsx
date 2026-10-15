import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Modal} from 'react-native-paper';
import Toast from 'react-native-toast-message';

const AddTaskModal = ({visible, userId, onClose, onTaskAdded, addTask}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startingWeek, setStartingWeek] = useState('');
  const [endingWeek, setEndingWeek] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setContent('');
    setStartingWeek('');
    setEndingWeek('');
  };

  const handleClose = () => {
    if (saving) return;

    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (!content.trim()) {
      setError('Please enter a task description.');
      return;
    }

    const start = Number(startingWeek);
    const end = Number(endingWeek);

    if (!Number.isInteger(start) || start < 1 || start > 42) {
      setError('Starting week must be between 1 and 42.');
      return;
    }

    if (!Number.isInteger(end) || end < 1 || end > 42) {
      setError('Ending week must be between 1 and 42.');
      return;
    }

    if (end < start) {
      setError('Ending week cannot be before starting week.');
      return;
    }

    try {
      setSaving(true);

      const result = await addTask(userId, {
        title: title.trim(),
        content: content.trim(),
        starting_week: start,
        ending_week: end,
      });

      if (!result?.success) {
        Toast.show({
          type: 'error',
          text1: result.error.message || 'Something went wrong!',
          visibilityTime: 1000,
          position: 'bottom',
        });
        throw new Error(result.error.message);
      }

      Toast.show({
        type: 'success',
        text1: 'Task added successfully!',
        visibilityTime: 1000,
        position: 'bottom',
      });

      resetForm();
      onClose();

      // Let parent refresh its task list
      onTaskAdded?.(result);
    } catch (err) {
      console.error('Error adding appointment:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={handleClose}
      contentContainerStyle={styles.modal}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Add task</Text>

          <Text style={styles.subtitle}>
            Create a task for your pregnancy journey.
          </Text>

          {/* Task */}
          <Text style={styles.label}>Task</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Book first ultrasound"
            placeholderTextColor="#9A9397"
            style={styles.input}
            maxLength={100}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Add a short description"
            placeholderTextColor="#9A9397"
            style={[styles.input, styles.contentInput]}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          {/* Weeks */}
          <View style={styles.weekRow}>
            <View style={styles.weekField}>
              <Text style={styles.label}>Starting week</Text>

              <TextInput
                value={startingWeek}
                onChangeText={setStartingWeek}
                placeholder="e.g. 12"
                placeholderTextColor="#9A9397"
                keyboardType="number-pad"
                style={styles.input}
                maxLength={2}
              />
            </View>

            <View style={styles.weekField}>
              <Text style={styles.label}>Ending week</Text>

              <TextInput
                value={endingWeek}
                onChangeText={setEndingWeek}
                placeholder="e.g. 14"
                placeholderTextColor="#9A9397"
                keyboardType="number-pad"
                style={styles.input}
                maxLength={2}
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.saveText}>
                {saving ? 'Adding...' : 'Add task'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddTaskModal;

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    borderRadius: 18,
    padding: 20,
    maxHeight: '85%',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#292529',
  },

  subtitle: {
    fontSize: 12,
    color: '#81797E',
    marginTop: 4,
    marginBottom: 20,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#554D52',
    marginBottom: 6,
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E8E1E4',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#292529',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },

  contentInput: {
    height: 76,
    paddingTop: 11,
  },

  weekRow: {
    flexDirection: 'row',
    gap: 10,
  },

  weekField: {
    flex: 1,
  },

  error: {
    color: '#C13F68',
    fontSize: 12,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F7F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: '#686166',
    fontSize: 13,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1.3,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DA4F7A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.6,
  },
});
