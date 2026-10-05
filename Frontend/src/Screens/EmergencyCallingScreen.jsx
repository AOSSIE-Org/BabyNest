import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const STORAGE_KEY = 'emergency_contacts';
const COUNTDOWN_SECONDS = 5;

/**
 * Get the initials from a contact name for the avatar.
 */
function getInitials(name) {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

/**
 * Validate a phone number string.
 * Allows digits, spaces, dashes, parens, and optional leading +.
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned);
}

/**
 * Load emergency contacts from AsyncStorage.
 */
async function loadContacts() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load emergency contacts:', error);
  }
  return [];
}

/**
 * Save emergency contacts to AsyncStorage.
 */
async function saveContacts(contacts) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    return true;
  } catch (error) {
    console.error('Failed to save emergency contacts:', error);
    return false;
  }
}

/**
 * Attempt to make a phone call using the Linking API.
 */
async function makeCall(phoneNumber) {
  const url = `tel:${phoneNumber}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    Alert.alert(
      'Call Not Supported',
      'Phone calls are not supported on this device.',
    );
    return false;
  } catch (error) {
    console.error('Failed to make call:', error);
    Alert.alert('Call Failed', 'Could not initiate the phone call.');
    return false;
  }
}

/**
 * Attempt to open the SMS app using the Linking API.
 */
async function sendSMS(phoneNumber) {
  const url =
    Platform.OS === 'ios'
      ? `sms:${phoneNumber}&body=Emergency!%20I%20need%20help!`
      : `sms:${phoneNumber}?body=Emergency!%20I%20need%20help!`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    Alert.alert(
      'SMS Not Supported',
      'SMS is not supported on this device.',
    );
    return false;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    Alert.alert('SMS Failed', 'Could not open the SMS app.');
    return false;
  }
}

export default function EmergencyCallingScreen({navigation}) {
  const [contacts, setContacts] = useState([]);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const timerRef = useRef(null);

  // Load contacts on mount
  useEffect(() => {
    loadContacts().then(loaded => {
      setContacts(loaded);
      if (loaded.length > 0) {
        setIsCountdownActive(true);
      }
    });
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Countdown timer logic
  const isCountdownPositive = countdown > 0;
  useEffect(() => {
    if (isCountdownActive && isCountdownPositive) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isCountdownActive, isCountdownPositive]);

  // Auto-call when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isCountdownActive && contacts.length > 0) {
      setIsCountdownActive(false);
      makeCall(contacts[0].phone);
    }
  }, [countdown, isCountdownActive, contacts]);

  const handleSafe = useCallback(() => {
    setIsCountdownActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    navigation.goBack();
  }, [navigation]);

  const handleAddContact = useCallback(async () => {
    const trimmedName = newName.trim();
    const trimmedPhone = newPhone.trim();

    if (!trimmedName) {
      Toast.show({
        type: 'error',
        text1: 'Name Required',
        text2: 'Please enter a contact name.',
      });
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid phone number (7-15 digits).',
      });
      return;
    }

    const newContact = {name: trimmedName, phone: trimmedPhone};
    const updated = [...contacts, newContact];
    const saved = await saveContacts(updated);

    if (saved) {
      setContacts(updated);
      setNewName('');
      setNewPhone('');
      setShowAddModal(false);

      Toast.show({
        type: 'success',
        text1: 'Contact Added',
        text2: `${trimmedName} added as emergency contact.`,
      });

      // Start countdown if this was the first contact
      if (contacts.length === 0) {
        setCountdown(COUNTDOWN_SECONDS);
        setIsCountdownActive(true);
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Could not save contact. Please try again.',
      });
    }
  }, [newName, newPhone, contacts]);

  const handleDeleteContact = useCallback(
    index => {
      Alert.alert(
        'Remove Contact',
        `Remove ${contacts[index].name} from emergency contacts?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const updated = contacts.filter((_, i) => i !== index);
              const saved = await saveContacts(updated);
              if (saved) {
                setContacts(updated);
                Toast.show({
                  type: 'success',
                  text1: 'Contact Removed',
                });
              }
            },
          },
        ],
      );
    },
    [contacts],
  );

  const renderContact = ({item, index}) => (
    <View style={styles.contactCard}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactInitials}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.contactPhone} numberOfLines={1}>
          {item.phone}
        </Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => makeCall(item.phone)}>
          <Icon name="call" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.smsButton]}
          onPress={() => sendSMS(item.phone)}>
          <Icon name="chatbubble" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteContact(index)}>
          <Icon name="trash" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // No contacts — show prompt to add
  if (contacts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="alert-circle-outline" size={80} color="#FF6F61" />
        <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
        <Text style={styles.emptySubtitle}>
          Add at least one emergency contact to enable the SOS feature.
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}>
          <Icon name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Emergency Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>

        {/* Add Contact Modal */}
        <AddContactModal
          visible={showAddModal}
          newName={newName}
          newPhone={newPhone}
          onNameChange={setNewName}
          onPhoneChange={setNewPhone}
          onAdd={handleAddContact}
          onClose={() => {
            setShowAddModal(false);
            setNewName('');
            setNewPhone('');
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.callingContainer}>
      {/* Header */}
      <Text style={styles.callingText}>
        {isCountdownActive
          ? 'Emergency Calling...'
          : countdown === 0
          ? 'Calling Emergency Contact'
          : 'Emergency'}
      </Text>

      {/* Countdown Circle */}
      <View style={styles.callingCircle}>
        <Text style={styles.counter}>
          {isCountdownActive ? countdown : '!'}
        </Text>
      </View>

      {isCountdownActive && (
        <Text style={styles.countdownHint}>
          Calling {contacts[0]?.name} in {countdown}s...
        </Text>
      )}

      {/* Emergency Contacts List */}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(_, index) => String(index)}
        style={styles.contactList}
        contentContainerStyle={styles.contactListContent}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addContactInline}
            onPress={() => setShowAddModal(true)}>
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addContactInlineText}>Add Contact</Text>
          </TouchableOpacity>
        }
      />

      {/* I AM SAFE Button */}
      <TouchableOpacity style={styles.safeButton} onPress={handleSafe}>
        <Icon name="shield-checkmark" size={22} color="#FF6F61" />
        <Text style={styles.safeText}>I AM SAFE</Text>
      </TouchableOpacity>

      {/* Add Contact Modal */}
      <AddContactModal
        visible={showAddModal}
        newName={newName}
        newPhone={newPhone}
        onNameChange={setNewName}
        onPhoneChange={setNewPhone}
        onAdd={handleAddContact}
        onClose={() => {
          setShowAddModal(false);
          setNewName('');
          setNewPhone('');
        }}
      />
    </View>
  );
}

/**
 * Modal component for adding a new emergency contact.
 */
function AddContactModal({
  visible,
  newName,
  newPhone,
  onNameChange,
  onPhoneChange,
  onAdd,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Emergency Contact</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Contact Name"
            placeholderTextColor="#999"
            value={newName}
            onChangeText={onNameChange}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.modalInput}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            value={newPhone}
            onChangeText={onPhoneChange}
            keyboardType="phone-pad"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSave} onPress={onAdd}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Main calling screen
  callingContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FF6F61',
    paddingTop: 60,
    paddingBottom: 30,
  },
  callingText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 20,
  },
  callingCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  counter: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  countdownHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
  },

  // Contact list
  contactList: {
    width: '100%',
    maxHeight: 280,
  },
  contactListContent: {
    paddingHorizontal: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  contactInfo: {
    flex: 1,
    marginRight: 8,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  contactPhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  deleteButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Add contact inline button
  addContactInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  addContactInlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Safe button
  safeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  safeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F61',
    marginLeft: 8,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE8E5',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6F61',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: '#FF6F61',
    fontSize: 15,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#FF6F61',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
