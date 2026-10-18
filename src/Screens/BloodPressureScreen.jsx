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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addBPLog,
  deleteBPLog,
  getBPLogs,
  updateBPLog,
} from '../storage/bloodPressure';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BloodPressureScreen() {
  const [week, setWeek] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  //Edit Modal State
  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchBPLogs = async () => {
    try {
      const user_id = await AsyncStorage.getItem('user_id');

      const getBPLogs_response = await getBPLogs(user_id);
      if (getBPLogs_response.success) {
        const data = getBPLogs_response.data;
        setHistory(data);
      } else {
        throw new Error(getBPLogs_response.error.message);
      }
    } catch (err) {
      console.error('Failed to fetch BP logs:', err);
    }
  };

  useEffect(() => {
    fetchBPLogs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBPLogs();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!week || !systolic || !diastolic || !time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const user_id = await AsyncStorage.getItem('user_id');

      const addBPLog_res = await addBPLog(user_id, {
        week_number: week,
        systolic,
        diastolic,
        time,
        note,
      });
      if (!addBPLog_res.success) {
        Toast.show({
          type: 'error',
          text1: addBPLog_res.error.message || 'Error in creating BP log!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(addBPLog_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'BP log added successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      setWeek('');
      setSystolic('');
      setDiastolic('');
      setTime('');
      setNote('');
      fetchBPLogs();
    } catch (err) {
      console.error('Failed to save BP log:', err);
    }
  };

  const openEditModal = entry => {
    setEditData(entry);
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const user_id = await AsyncStorage.getItem('user_id');

      const response = await updateBPLog(user_id, editData.id, {
        week_number: editData.week_number,
        systolic: editData.systolic,
        diastolic: editData.diastolic,
        time: editData.time,
        note: editData.note,
      });

      if (!response.success) {
        Toast.show({
          type: 'error',
          text1: response.error.message || 'Error updating BP log!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(response.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'BP log updated successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });

      setEditVisible(false);
      setEditData(null);
      fetchBPLogs();
    } catch (err) {
      console.error('Failed to update BP log:', err);
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
              const user_id = await AsyncStorage.getItem('user_id');
              const response = await deleteBPLog(user_id, id);
              if (!response.success) {
                Toast.show({
                  type: 'error',
                  text1: response.error.message || 'Error deleting BP log!',
                  visibilityTime: 2000,
                  position: 'bottom',
                  topOffset: 50,
                });
                throw new Error(response.error.message);
              }
              Toast.show({
                type: 'success',
                text1: 'BP log deleted successfully!',
                visibilityTime: 2000,
                position: 'bottom',
                topOffset: 50,
              });

              fetchBPLogs();
            } catch (err) {
              console.error('Failed to delete BP log:', err);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Blood Pressure Tracker" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Blood Pressure</Text>

            <TextInput
              label="Week Number"
              value={week}
              onChangeText={setWeek}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <View style={styles.bpRow}>
              <TextInput
                label="Systolic"
                value={systolic}
                onChangeText={setSystolic}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.bpInput]}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="rgb(218,79,122)"
                textColor="#454545"
              />

              <TextInput
                label="Diastolic"
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.bpInput]}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="rgb(218,79,122)"
                textColor="#454545"
              />
            </View>

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
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  activeOutlineColor="rgb(218,79,122)"
                  textColor="#454545"
                  left={<TextInput.Icon icon="clock-outline" />}
                />
              </View>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);

                  if (selectedTime) {
                    const hours = selectedTime.getHours();
                    const minutes = selectedTime.getMinutes();

                    const formattedHours = hours % 12 || 12;
                    const formattedMinutes = minutes
                      .toString()
                      .padStart(2, '0');

                    const period = hours >= 12 ? 'PM' : 'AM';

                    setTime(`${formattedHours}:${formattedMinutes} ${period}`);
                  }
                }}
              />
            )}

            <TextInput
              label="Note"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              buttonColor="rgb(218,79,122)"
              style={styles.button}
              contentStyle={styles.buttonContent}>
              <Text style={styles.buttonText}>Save Entry</Text>
            </Button>
          </Card.Content>
        </Card>

        <Text style={styles.historyTitle}>Blood Pressure History</Text>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="bloodtype" size={34} color="rgb(218,79,122)" />
            </View>

            <Text style={styles.emptyTitle}>No Blood Pressure Log yet</Text>

            <Text style={styles.emptyText}>
              Add your first BP log above to start tracking.
            </Text>
          </View>
        ) : (
          history.map((entry, index) => (
            <Card key={index} style={styles.entryCard}>
              <Card.Content>
                <View style={styles.entryHeader}>
                  <View style={styles.bpInfo}>
                    <Text style={styles.bpValue}>
                      {entry.systolic}/{entry.diastolic}
                      <Text style={styles.bpUnit}> mmHg</Text>
                    </Text>

                    <Text style={styles.weekText}>
                      Week {entry.week_number}
                    </Text>
                  </View>

                  <View style={styles.iconRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.editButtonbg}
                      onPress={() => openEditModal(entry)}>
                      <Icon name="edit" size={18} color="#4a90e2" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.deleteButtonbg}
                      onPress={() => handleDelete(entry.id)}>
                      <Icon name="delete" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.entryDivider} />

                <View style={styles.metaRow}>
                  <Icon name="access-time" size={17} color="#777" />
                  <Text style={styles.metaText}>{entry.time}</Text>
                </View>

                {entry.note && (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Note</Text>
                    <Text style={styles.entryNote}>{entry.note}</Text>
                  </View>
                )}

                <Text style={styles.entryDate}>
                  {new Date(entry.created_at).toLocaleString()}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <Portal>
        <Dialog
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          style={styles.editDialog}>
          <Dialog.Title style={styles.editTitle}>Edit Entry</Dialog.Title>

          <Dialog.Content>
            <TextInput
              label="Week Number"
              value={editData?.week_number?.toString() || ''}
              onChangeText={text =>
                setEditData({...editData, week_number: text})
              }
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <View style={styles.bpRow}>
              <TextInput
                label="Systolic"
                value={editData?.systolic?.toString() || ''}
                onChangeText={text =>
                  setEditData({...editData, systolic: text})
                }
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.bpInput]}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="rgb(218,79,122)"
                textColor="#454545"
              />

              <TextInput
                label="Diastolic"
                value={editData?.diastolic?.toString() || ''}
                onChangeText={text =>
                  setEditData({...editData, diastolic: text})
                }
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.bpInput]}
                outlineStyle={styles.inputOutline}
                activeOutlineColor="rgb(218,79,122)"
                textColor="#454545"
              />
            </View>

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
              onChangeText={text => setEditData({...editData, note: text})}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />
          </Dialog.Content>

          <Dialog.Actions style={styles.editActions}>
            <Button onPress={() => setEditVisible(false)} textColor="#666">
              Cancel
            </Button>

            <Button
              mode="contained"
              onPress={handleUpdate}
              buttonColor="rgb(218,79,122)"
              style={styles.saveButton}>
              <Text style={styles.buttonText}>Save</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF5F8'},
  content: {padding: 20},
  formCard: {
    // marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#222',
    marginBottom: 18,
  },

  input: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },

  inputOutline: {
    borderRadius: 10,
  },

  bpRow: {
    flexDirection: 'row',
    gap: 10,
  },

  bpInput: {
    flex: 1,
  },

  timeInputWrapper: {
    marginBottom: 0,
  },

  button: {
    marginTop: 4,
    borderRadius: 10,
  },

  buttonContent: {
    height: 46,
  },

  timeInput: {
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  button: {
    backgroundColor: 'rgb(218,79,122)',
    paddingVertical: 8,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
  },
  historyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#222',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },

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
  entryCard: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },

  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bpInfo: {
    flex: 1,
  },

  bpValue: {
    fontSize: 21,
    fontWeight: '700',
    color: '#222',
  },

  bpUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#777',
  },

  weekText: {
    fontSize: 13,
    color: '#777',
    marginTop: 3,
  },

  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  editButtonbg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#4a90e218',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonbg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#e74c3c18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  entryDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    fontSize: 14,
    color: '#555',
  },

  noteContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },

  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777',
    marginBottom: 2,
  },

  entryNote: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },

  entryDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
  },
  editDialog: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  editTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },

  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  inputOutline: {
    borderRadius: 10,
  },

  bpRow: {
    flexDirection: 'row',
    gap: 10,
  },

  bpInput: {
    flex: 1,
  },

  editActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  saveButton: {
    borderRadius: 8,
  },
});
