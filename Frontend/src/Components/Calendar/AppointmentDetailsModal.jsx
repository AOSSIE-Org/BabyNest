import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';

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

const changeDateFormat = date => {
  if (!date) return '';
  const dateObj = new Date(date);
  if (!isFinite(dateObj.getTime())) return '';
  
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month}, ${year}`;
};

const AppointmentDetailsModal = ({ visible, onClose, appointment, onEdit, onDelete }) => {
  const { theme } = useTheme();

  if (!appointment) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close modal">
            <Icon name="close" size={20} color={theme.primary} />
          </TouchableOpacity>

          {/* Icon Header */}
           <View style={styles.iconContainer}>
              <View style={[styles.topBadge, { backgroundColor: theme.appointment || theme.primary + '20' }]} />
              <View style={[styles.sparkle, { backgroundColor: theme.primary }]} />
          </View>

          <Text style={styles.title}>{appointment.title}</Text>
          
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
             <View style={styles.detailRow}>
                <Icon name="calendar-outline" size={18} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}>
                    {changeDateFormat(appointment.appointment_date)} at {appointment.time || appointment.appointment_time}
                </Text>
             </View>

             <View style={styles.detailRow}>
                <Icon name="location-outline" size={18} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}>
                    {appointment.appointment_location || 'No location set'}
                </Text>
             </View>

             <View style={styles.divider} />

            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.modalContentText}>{appointment.content || 'No description provided.'}</Text>
          </ScrollView>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => {
                onClose();
                onEdit(appointment);
              }}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => {
                onDelete(appointment.id);
                onClose();
              }}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    maxWidth: 350,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center'
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
  iconContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
    position: 'relative',
    height: 50, 
    width: 60,
  },
  topBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'absolute',
    top: 0
  },
  sparkle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 5,
    right: 5
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
    letterSpacing: -0.5,
  },
  contentContainer: {
    width: '100%',
    marginBottom: 20
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10
  },
  detailIcon: {
      marginRight: 8
  },
  detailText: {
      fontSize: 15,
      color: '#444',
      fontWeight: '500'
  },
  divider: {
      height: 1,
      backgroundColor: '#eee',
      marginVertical: 12,
      width: '100%'
  },
  descriptionLabel: {
      fontSize: 14,
      color: '#888',
      marginBottom: 6,
      fontWeight: '600',
       paddingHorizontal: 10
  },
  modalContentText: {
      fontSize: 15,
      color: '#333',
      lineHeight: 22,
       paddingHorizontal: 10
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'space-between'
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deleteButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16
  }
});

export default AppointmentDetailsModal;
