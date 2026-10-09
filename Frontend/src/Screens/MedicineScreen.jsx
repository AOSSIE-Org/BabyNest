import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {TextInput, Button, Card, Portal, Dialog} from 'react-native-paper';
import HeaderWithBack from '../Components/HeaderWithBack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addMedicine,
  deleteMedicine,
  getAllMedicine,
  markMedicineTaken,
  updateMedicine,
} from '../storage/medicine';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

export default function MedicineScreen() {
  const [week, setWeek] = useState('');
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [user_id, setUser_id] = useState(null);

  const fetchMedicineHistory = async user_id => {
    try {
      const getAllMedicine_res = await getAllMedicine(user_id);
      if (!getAllMedicine_res.success) {
        throw new Error(getAllMedicine_res.error.message);
      }
      const data = await getAllMedicine_res.data;
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch medicine records:', err);
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

        await fetchMedicineHistory(userId);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedicineHistory(user_id);
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!week || !name || !dose || !time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const addMedicine_res = await addMedicine(user_id, {
        week_number: week,
        name,
        dose,
        time,
        note,
      });
      if (!addMedicine_res.success) {
        Toast.show({
          type: 'error',
          text1: addMedicine_res.error.message || 'Error adding appointment!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(addMedicine_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'Medicine added successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      setWeek('');
      setName('');
      setDose('');
      setTime('');
      setNote('');
      fetchMedicineHistory(user_id);
    } catch (err) {
      console.error('Failed to save medicine:', err);
    }
  };

  const openEditModal = entry => {
    setEditData(entry);
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const updateMedicine_res = await updateMedicine(user_id, editData.id, {
        week_number: editData.week_number,
        name: editData.name,
        dose: editData.dose,
        time: editData.time,
        note: editData.note,
      });
      if (!updateMedicine_res.success) {
        Toast.show({
          type: 'error',
          text1:
            updateMedicine_res.error.message || 'Error adding appointment!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(updateMedicine_res.error.message);
      }
      setEditVisible(false);
      setEditData(null);
      Toast.show({
        type: 'success',
        text1: 'Medicine updated successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      fetchMedicineHistory(user_id);
    } catch (err) {
      console.error('Failed to update medicine:', err);
    }
  };

  const handleDelete = async id => {
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
              const deleteMedicine_res = await deleteMedicine(user_id, id);
              if (!deleteMedicine_res.success) {
                Toast.show({
                  type: 'error',
                  text1:
                    deleteMedicine_res.error.message ||
                    'Error deleting appointment!',
                  visibilityTime: 2000,
                  position: 'bottom',
                  topOffset: 50,
                });
                throw new Error(deleteMedicine_res.error.message);
              }
              Toast.show({
                type: 'success',
                text1: 'Medicine deleted successfully!',
                visibilityTime: 2000,
                position: 'bottom',
                topOffset: 50,
              });
              fetchMedicineHistory(user_id);
            } catch (err) {
              console.error('Failed to delete medicine:', err);
            }
          },
        },
      ],
    );
  };

  const handleMarkAsTaken = async (id, currentStatus) => {
    try {
      const markMedicineTaken_res = await markMedicineTaken(
        user_id,
        id,
        !currentStatus,
      );
      if (!markMedicineTaken_res.success) {
        Toast.show({
          type: 'error',
          text1:
            markMedicineTaken_res.error.message || 'Error adding appointment!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(markMedicineTaken_res.error.message);
      }
      fetchMedicineHistory(user_id);
    } catch (err) {
      console.error('Failed to mark medicine:', err);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Medicine Tracker" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="rgb(218,79,122)"
          />
        }>
        {/* Add Medicine */}
        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Icon name="add" size={20} color="#fff" />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Add Medicine</Text>
                <Text style={styles.sectionSubtitle}>
                  Enter your medicine details
                </Text>
              </View>
            </View>

            <TextInput
              label="Week Number"
              value={week}
              onChangeText={setWeek}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <TextInput
              label="Medicine Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              left={<TextInput.Icon icon="pill" />}
              style={styles.input}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <View style={styles.rowInputs}>
              <TextInput
                label="Dose"
                placeholder="e.g. 500mg"
                value={dose}
                onChangeText={setDose}
                mode="outlined"
                left={<TextInput.Icon icon="medical-bag" />}
                style={[styles.input, styles.halfInput]}
                textColor="#454545"
                outlineStyle={styles.inputOutline}
                activeOutlineColor="rgb(218,79,122)"
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowTimePicker(true)}
                style={styles.timeInputWrapper}>
                <View pointerEvents="none">
                  <TextInput
                    label="Time"
                    value={time}
                    placeholder="Select time"
                    mode="outlined"
                    editable={false}
                    left={<TextInput.Icon icon="clock-outline" />}
                    style={styles.timeInput}
                    textColor="#454545"
                    outlineStyle={styles.inputOutline}
                    activeOutlineColor="rgb(218,79,122)"
                  />
                </View>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(_, selectedTime) => {
                    setShowTimePicker(false);

                    if (selectedTime) {
                      const hours = selectedTime.getHours();
                      const minutes = selectedTime.getMinutes();

                      const formattedHours = hours % 12 || 12;
                      const formattedMinutes = minutes
                        .toString()
                        .padStart(2, '0');

                      const period = hours >= 12 ? 'PM' : 'AM';

                      setTime(
                        `${formattedHours}:${formattedMinutes} ${period}`,
                      );
                    }
                  }}
                />
              )}
            </View>

            <TextInput
              label="Note (optional)"
              placeholder="Add any additional information..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              mode="outlined"
              left={<TextInput.Icon icon="note-text-outline" />}
              style={[styles.input, styles.noteInput]}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="plus">
              <Text>Save Medicine</Text>
            </Button>
          </Card.Content>
        </Card>

        {/* History Header */}
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.historyTitle}>Medicine History</Text>
            <Text style={styles.historySubtitle}>Your recorded medicines</Text>
          </View>

          <View style={styles.historyCount}>
            <Text style={styles.historyCountText}>{history.length}</Text>
          </View>
        </View>

        {/* History */}
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="medication" size={34} color="rgb(218,79,122)" />
            </View>

            <Text style={styles.emptyTitle}>No medicines yet</Text>

            <Text style={styles.emptyText}>
              Add your first medicine above to start tracking.
            </Text>
          </View>
        ) : (
          history.map((entry, index) => (
            <Card
              key={index}
              style={[styles.entryCard, entry.taken && styles.takenCard]}>
              <Card.Content>
                {/* Top row */}
                <View style={styles.entryTopRow}>
                  <View style={styles.entryMain}>
                    <Icon
                      name={
                        entry.taken ? 'check-circle' : 'radio-button-unchecked'
                      }
                      size={27}
                      color={entry.taken ? '#27ae60' : 'rgb(218,79,122)'}
                      onPress={() => handleMarkAsTaken(entry.id, entry.taken)}
                      style={styles.checkIcon}
                    />

                    <View style={styles.medicineIcon}>
                      <Icon
                        name="medication"
                        size={21}
                        color="rgb(218,79,122)"
                      />
                    </View>

                    <View style={styles.medicineInfo}>
                      <Text
                        style={[
                          styles.entryText,
                          entry.taken && styles.takenText,
                        ]}
                        numberOfLines={1}>
                        {entry.name}
                      </Text>

                      <Text style={styles.weekText}>
                        Week {entry.week_number}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionContainer}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(entry)}>
                      <Icon name="edit" size={19} color="#4a90e2" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(entry.id)}>
                      <Icon name="delete-outline" size={19} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Medicine details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Icon name="medical-services" size={18} color="#777" />
                    <View>
                      <Text style={styles.detailLabel}>Dose</Text>
                      <Text style={styles.detailValue}>
                        {entry.dose || 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Icon name="access-time" size={18} color="#777" />
                    <View>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={styles.detailValue}>
                        {entry.time || 'Not specified'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Note */}
                {entry.note ? (
                  <View style={styles.noteContainer}>
                    <Icon
                      name="description"
                      size={17}
                      color="rgb(218,79,122)"
                    />

                    <Text style={styles.entryNote}>{entry.note}</Text>
                  </View>
                ) : null}

                {/* Date */}
                <View style={styles.dateContainer}>
                  <Icon name="access-time" size={14} color="#aaa" />

                  <Text style={styles.entryDate}>
                    {new Date(entry.created_at).toLocaleString()}
                  </Text>

                  {entry.taken && (
                    <View style={styles.takenBadge}>
                      <Text style={styles.takenBadgeText}>Taken</Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Dialog
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Edit Medicine</Dialog.Title>

          <Dialog.Content>
            <Text style={styles.dialogSubtitle}>
              Update your medicine details
            </Text>

            <TextInput
              label="Week Number"
              value={editData?.week_number?.toString() || ''}
              onChangeText={text =>
                setEditData({
                  ...editData,
                  week_number: text,
                })
              }
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <TextInput
              label="Medicine Name"
              value={editData?.name || ''}
              onChangeText={text =>
                setEditData({
                  ...editData,
                  name: text,
                })
              }
              mode="outlined"
              left={<TextInput.Icon icon="pill" />}
              style={styles.input}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <TextInput
              label="Dose"
              value={editData?.dose || ''}
              onChangeText={text =>
                setEditData({
                  ...editData,
                  dose: text,
                })
              }
              mode="outlined"
              left={<TextInput.Icon icon="medical-bag" />}
              style={styles.input}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowEditTimePicker(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="Time"
                  value={editData?.time || ''}
                  placeholder="Select time"
                  mode="outlined"
                  editable={false}
                  left={
                    <TextInput.Icon
                      icon={({size, color}) => (
                        <Icon name="access-time" size={size} color={color} />
                      )}
                    />
                  }
                  style={styles.input}
                  textColor="#454545"
                  outlineStyle={styles.inputOutline}
                  activeOutlineColor="rgb(218,79,122)"
                />
              </View>
            </TouchableOpacity>
            {showEditTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowEditTimePicker(false);

                  if (selectedTime) {
                    const hours = selectedTime.getHours();
                    const minutes = selectedTime.getMinutes();

                    const formattedHours = hours % 12 || 12;
                    const formattedMinutes = minutes
                      .toString()
                      .padStart(2, '0');

                    const period = hours >= 12 ? 'PM' : 'AM';

                    setEditData({
                      ...editData,
                      time: `${formattedHours}:${formattedMinutes} ${period}`,
                    });
                  }
                }}
              />
            )}
            <TextInput
              label="Note"
              value={editData?.note || ''}
              onChangeText={text =>
                setEditData({
                  ...editData,
                  note: text,
                })
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="note-text-outline" />}
              style={[styles.input, styles.modalNoteInput]}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />
          </Dialog.Content>

          <Dialog.Actions style={styles.dialogActions}>
            <Button onPress={() => setEditVisible(false)} textColor="#777">
              <Text> Cancel</Text>
            </Button>

            <Button
              mode="contained"
              onPress={handleUpdate}
              buttonColor="rgb(218,79,122)"
              textColor="#fff"
              style={styles.saveEditButton}>
              <Text>Save Changes</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 100,
  },

  // Page Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFE1EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  headerTextContainer: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#2D2D2D',
  },

  pageSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 3,
  },

  // Form
  formCard: {
    borderRadius: 22,
    backgroundColor: '#fff',
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  formContent: {
    padding: 18,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgb(218,79,122)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#333',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  input: {
    backgroundColor: '#fff',
    marginBottom: 14,
  },

  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.2,
  },

  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },

  halfInput: {
    flex: 1,
  },

  noteInput: {
    minHeight: 95,
    textAlignVertical: 'top',
  },

  timeInputWrapper: {
    flex: 1,
  },

  timeInput: {
    backgroundColor: '#fff',
    marginBottom: 14,
  },

  button: {
    backgroundColor: 'rgb(218,79,122)',
    borderRadius: 13,
    marginTop: 3,
  },

  buttonContent: {
    height: 52,
  },

  buttonLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  // History
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },

  historySubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  historyCount: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: '#FFE1EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  historyCountText: {
    color: 'rgb(218,79,122)',
    fontSize: 14,
    fontWeight: '800',
  },

  // Entry Card
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 13,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  takenCard: {
    backgroundColor: '#FAFCFA',
  },

  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  entryMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkIcon: {
    marginRight: 9,
  },

  medicineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  medicineInfo: {
    flex: 1,
  },

  entryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },

  takenText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },

  weekText: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },

  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    gap: 7,
    marginLeft: 8,
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EEF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Details
  detailsContainer: {
    flexDirection: 'row',
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },

  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginLeft: 8,
    marginTop: 1,
  },

  // Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7FA',
    borderRadius: 10,
    padding: 10,
    marginTop: 13,
  },

  entryNote: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#666',
    marginLeft: 8,
  },

  // Date
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },

  entryDate: {
    flex: 1,
    fontSize: 11,
    color: '#aaa',
    marginLeft: 5,
  },

  // Taken Badge
  takenBadge: {
    backgroundColor: '#E8F7EE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  takenBadgeText: {
    color: '#27ae60',
    fontSize: 10,
    fontWeight: '800',
  },

  // Empty State
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFEAF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#444',
  },

  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },

  // Dialog
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 22,
  },

  dialogTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#333',
  },

  dialogSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },

  modalNoteInput: {
    minHeight: 80,
  },

  dialogActions: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },

  saveEditButton: {
    borderRadius: 10,
  },
});
