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
import {TextInput, Button, Card, Dialog, Portal} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HeaderWithBack from '../Components/HeaderWithBack';
import {
  addDischargeLog,
  deleteDischargeLog,
  getDischargeLogs,
  updateDischargeLog,
} from '../storage/discharge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function DischargeScreen() {
  const [week, setWeek] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('');
  const [bleeding, setBleeding] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user_id, setUser_id] = useState(null);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchDischargeLogs = async user_id => {
    try {
      const getDischargeLogs_res = await getDischargeLogs(user_id);
      if (!getDischargeLogs_res.success) {
        throw new Error(getDischargeLogs_res.error.message);
      }
      const data = await getDischargeLogs_res.data;
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch discharge logs:', err);
      Alert.alert('Error', 'Failed to load discharge logs. Please try again.');
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

        await fetchDischargeLogs(userId);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDischargeLogs(user_id);
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!week || !type || !color || !bleeding) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }
    try {
      const addDischargeLog_res = await addDischargeLog(user_id, {
        week_number: week,
        type,
        color,
        bleeding,
        note,
      });

      if (!addDischargeLog_res.success) {
        Toast.show({
          type: 'error',
          text1:
            addDischargeLog_res.error.message ||
            'Error creating discharge log!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(addDischargeLog_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'Discharge log created successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });

      setWeek('');
      setType('');
      setColor('');
      setBleeding('');
      setNote('');
      fetchDischargeLogs(user_id);
    } catch (err) {
      console.error('Failed to add discharge log:', err);
    }
  };

  const handleDelete = id => {
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
              const deleteDischargeLog_res = await deleteDischargeLog(
                user_id,
                id,
              );

              if (!deleteDischargeLog_res.success) {
                Toast.show({
                  type: 'error',
                  text1:
                    deleteDischargeLog_res.error.message ||
                    'Error deleting discharge log!',
                  visibilityTime: 2000,
                  position: 'bottom',
                  topOffset: 50,
                });
                throw new Error(deleteDischargeLog_res.error.message);
              }
              Toast.show({
                type: 'success',
                text1: 'Discharge log deleted successfully!',
                visibilityTime: 2000,
                position: 'bottom',
                topOffset: 50,
              });

              fetchDischargeLogs(user_id);
            } catch (err) {
              console.error('Failed to delete entry:', err);
            }
          },
        },
      ],
    );
  };

  const openEditModal = entry => {
    setEditData({
      id: entry.id,
      week_number: entry.week_number.toString(),
      type: entry.type,
      color: entry.color,
      bleeding: entry.bleeding,
      note: entry.note || '',
    });
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    if (
      !editData.week_number ||
      !editData.type ||
      !editData.color ||
      !editData.bleeding
    ) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }
    try {
      const updateDischargeLog_res = await updateDischargeLog(
        user_id,
        editData.id,
        {
          week_number: editData.week_number,
          type: editData.type,
          color: editData.color,
          bleeding: editData.bleeding,
          note: editData.note,
        },
      );

      if (!updateDischargeLog_res.success) {
        Toast.show({
          type: 'error',
          text1:
            updateDischargeLog_res.error.message ||
            'Error updating discharge log!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(updateDischargeLog_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'Discharge log updated successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });

      setEditVisible(false);
      setEditData(null);
      fetchDischargeLogs(user_id);
    } catch (err) {
      console.error('Failed to update entry:', err);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Discharge Tracker" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Discharge Entry</Text>

            <TextInput
              label="Week Number"
              value={week}
              onChangeText={setWeek}
              keyboardType="numeric"
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={({size, color}) => (
                    <Icon name="calendar-month" size={size} color={color} />
                  )}
                />
              }
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <TextInput
              label="Type"
              value={type}
              onChangeText={setType}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={({size, color}) => (
                    <Icon name="description" size={size} color={color} />
                  )}
                />
              }
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <TextInput
              label="Color"
              value={color}
              onChangeText={setColor}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={({size, color}) => (
                    <Icon name="palette" size={size} color={color} />
                  )}
                />
              }
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <TextInput
              label="Bleeding"
              value={bleeding}
              onChangeText={setBleeding}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={({size, color}) => (
                    <Icon name="water-drop" size={size} color={color} />
                  )}
                />
              }
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <TextInput
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={[styles.input, styles.noteInput]}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              buttonColor="rgb(218,79,122)"
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}>
              Save Entry
            </Button>
          </Card.Content>
        </Card>

        {/* History */}
        <Text style={styles.historyTitle}>Discharge History</Text>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="bloodtype" size={34} color="rgb(218,79,122)" />
            </View>

            <Text style={styles.emptyTitle}>No Discharge Log yet</Text>

            <Text style={styles.emptyText}>
              Add your first Discharge log above to start tracking.
            </Text>
          </View>
        ) : (
          history.map((entry, index) => (
            <Card key={index} style={styles.entryCard}>
              <Card.Content>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTitleRow}>
                    <Icon
                      name="calendar-month"
                      size={20}
                      color="rgb(218,79,122)"
                    />

                    <Text style={styles.entryTitle}>
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

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{entry.type}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color</Text>
                  <Text style={styles.detailValue}>{entry.color}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bleeding</Text>
                  <Text style={styles.detailValue}>{entry.bleeding}</Text>
                </View>

                {entry.note ? (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Note</Text>
                    <Text style={styles.entryNote}>{entry.note}</Text>
                  </View>
                ) : null}

                <Text style={styles.entryDate}>
                  {new Date(entry.created_at).toLocaleString()}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Edit Dialog */}
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

            <TextInput
              label="Type"
              value={editData?.type || ''}
              onChangeText={text => setEditData({...editData, type: text})}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <TextInput
              label="Color"
              value={editData?.color || ''}
              onChangeText={text => setEditData({...editData, color: text})}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

            <TextInput
              label="Bleeding"
              value={editData?.bleeding || ''}
              onChangeText={text => setEditData({...editData, bleeding: text})}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
              textColor="#454545"
            />

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
              <Text style={styles.saveButtonText}>Save</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF5F8'},
  content: {padding: 20, paddingBottom: 80},
  formCard: {
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

  noteInput: {
    minHeight: 85,
  },

  inputOutline: {
    borderRadius: 10,
  },

  button: {
    marginTop: 4,
    borderRadius: 10,
  },

  buttonContent: {
    height: 46,
  },

  buttonLabel: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgb(218,79,122)',
    marginBottom: 10,
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

  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  entryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
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

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  detailLabel: {
    width: 75,
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
  },

  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },

  noteContainer: {
    marginTop: 6,
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

  editActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  saveButton: {
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  iconButton: {
    marginRight: 20,
  },
});
