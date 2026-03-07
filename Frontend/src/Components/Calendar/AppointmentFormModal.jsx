import React from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';
import { formatTime } from '../../utils/timeUtils';

const AppointmentFormModal = ({
  visible,
  onClose,
  appointment,
  setAppointment,
  onSave,
  onDatePress,
  title,
  saveLabel,
}) => {
  const { theme } = useTheme();
  const safeAppt = appointment || {};
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close modal">
              <Icon name="close" size={20} color={theme.primary} />
            </TouchableOpacity>

            {/* Header */}
            <Text style={styles.modalTitle}>{title}</Text>

            {/* Form Inputs & Buttons ScrollView */}
            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}>
              
              {/* Title Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  placeholder="Appointment title"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={safeAppt.title}
                  onChangeText={text =>
                    setAppointment({ ...safeAppt, title: text })
                  }
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputWrapper}>
                 <Text style={styles.label}>Description</Text>
                <TextInput
                  placeholder="Description"
                  placeholderTextColor="#999"
                  style={[styles.input, styles.descriptionInput]}
                  value={safeAppt.content}
                  onChangeText={text =>
                    setAppointment({ ...safeAppt, content: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Date & Time Row */}
              <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.inputWrapper, {flex: 1, marginRight: 8}]}
                    onPress={onDatePress}>
                    <Text style={styles.label}>Date</Text>
                    <TextInput
                    placeholder="Select date"
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={false}
                    value={safeAppt.appointment_date}
                    />
                </TouchableOpacity>





                <TouchableOpacity
                    style={[styles.inputWrapper, {flex: 1, marginLeft: 8}]}
                    onPress={onDatePress}>
                    <Text style={styles.label}>Time</Text>
                    <TextInput
                    placeholder="Select time"
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={false}
                    value={formatTime(safeAppt.appointment_time)}
                    />
                </TouchableOpacity>
              </View>

              {/* Location Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  placeholder="Location"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={safeAppt.appointment_location}
                  onChangeText={text =>
                    setAppointment({
                      ...safeAppt,
                      appointment_location: text,
                    })
                  }
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, {backgroundColor: theme.primary}]}
                  onPress={onSave}>
                  <Text style={styles.saveButtonText}>{saveLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      </ScrollView>
    </Modal>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    minHeight: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
    color: '#333',
    letterSpacing: -0.5,
  },
  formContainer: {
    marginBottom: 20,
    flexShrink: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
      fontSize: 12,
      fontWeight: '600',
      color: '#666',
      marginBottom: 6,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#fafafa'
  },
  descriptionInput: {
      height: 80,
      textAlignVertical: 'top'
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between'
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentFormModal;
