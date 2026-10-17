import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import {TextInput, Button, Card, Portal, Dialog} from 'react-native-paper';
import HeaderWithBack from '../Components/HeaderWithBack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  addSymptom,
  deleteSymptom,
  getAllSymptoms,
  updateSymptom,
} from '../storage/symptoms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function SymptomsScreen() {
  const [week, setWeek] = useState('');
  const [symptom, setSymptom] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);

  const [user_id, setUser_id] = useState(null);

  const fetchSymptomsHistory = async user_id => {
    try {
      const getAllSymptoms_res = await getAllSymptoms(user_id);
      if (!getAllSymptoms_res.success) {
        throw new Error(getAllSymptoms_res.error.message);
      }
      const data = getAllSymptoms_res.data;
      setHistory([...data]);
    } catch (err) {
      console.error('Failed to fetch symptoms:', err);
      Alert.alert('Error', 'Failed to load symptoms. Please try again.');
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

        await fetchSymptomsHistory(userId);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSymptomsHistory(user_id);
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!week || !symptom) {
      Alert.alert(
        'Validation Error',
        'Please fill in week number and symptom.',
      );
      return;
    }

    try {
      const addSymptom_res = await addSymptom(user_id, {
        week_number: week,
        symptom,
        note,
      });

      if (!addSymptom_res.success) {
        Toast.show({
          type: 'error',
          text1: addSymptom_res.error.message || 'Error adding symptom!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(addSymptom_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'Symptom added successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      setWeek('');
      setSymptom('');
      setNote('');
      fetchSymptomsHistory(user_id);
    } catch (err) {
      console.error('Failed to add symptom:', err);
    }
  };

  const openEditModal = entry => {
    setEditData(entry);
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    if (!editData?.week_number || !editData?.symptom) {
      Alert.alert(
        'Validation Error',
        'Please fill in week number and symptom.',
      );
      return;
    }

    try {
      const updateSymptom_res = await updateSymptom(user_id, editData.id, {
        week_number: editData.week_number,
        symptom: editData.symptom,
        note: editData.note,
      });

      if (!updateSymptom_res.success) {
        Toast.show({
          type: 'error',
          text1: updateSymptom_res.error.message || 'Error updating symptom!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(updateSymptom_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'symptom updated successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      setEditVisible(false);
      setEditData(null);
      fetchSymptomsHistory(user_id);
    } catch (err) {
      console.error('Failed to update symptom:', err);
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
              const deleteSymptom_res = await deleteSymptom(user_id, id);
              if (!deleteSymptom_res.success) {
                Toast.show({
                  type: 'error',
                  text1:
                    deleteSymptom_res.error.message ||
                    'Error deleting symptom!',
                  visibilityTime: 2000,
                  position: 'bottom',
                  topOffset: 50,
                });
                throw new Error(deleteSymptom_res.error.message);
              }
              Toast.show({
                type: 'success',
                text1: 'Symptom deleted successfully!',
                visibilityTime: 2000,
                position: 'bottom',
                topOffset: 50,
              });

              fetchSymptomsHistory(user_id);
            } catch (err) {
              console.error('Failed to delete symptom:', err);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Symptoms Tracker" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Symptom</Text>

            <TextInput
              label="Week Number"
              value={week}
              onChangeText={setWeek}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
              textColor="#454545"
            />
            <TextInput
              label="Symptom (e.g. Nausea)"
              value={symptom}
              onChangeText={setSymptom}
              mode="outlined"
              left={<TextInput.Icon icon="emoticon-sad-outline" />}
              style={styles.input}
              textColor="#454545"
            />
            <TextInput
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              mode="outlined"
              style={[styles.input, styles.noteInput]}
              textColor="#454545"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              labelStyle={{fontWeight: 'bold', color: '#fff'}}>
              Save Symptom
            </Button>
          </Card.Content>
        </Card>

        {/* History */}
        <Text style={styles.historyTitle}>Symptom History</Text>
        {history.map((entry, index) => (
          <Card key={index} style={styles.entryCard}>
            <Card.Content>
              <View style={styles.entryRowBetween}>
                <View style={styles.entryRow}>
                  <Icon
                    name="emoticon-sick-outline"
                    size={20}
                    color="rgb(218,79,122)"
                  />
                  <Text style={styles.entryText}>
                    {' '}
                    Week {entry.week_number}
                  </Text>
                </View>
                <View style={styles.iconRow}>
                  <View style={styles.editButtonbg}>
                    <Icon
                      name="pencil"
                      size={20}
                      color="#4a90e2"
                      onPress={() => openEditModal(entry)}
                      style={styles.iconButton}
                    />
                  </View>
                  <View style={styles.deleteButtonbg}>
                    <Icon
                      name="trash-can-outline"
                      size={20}
                      color="#e74c3c"
                      onPress={() => handleDelete(entry.id)}
                      style={styles.iconButton}
                    />
                  </View>
                </View>
              </View>
              <Text style={styles.entrySub}>
                Symptom: <Text style={styles.entrySubVal}>{entry.symptom}</Text>
              </Text>
              {entry.note ? (
                <Text style={styles.entryNote}>Note: {entry.note}</Text>
              ) : null}
              <Text style={styles.entryDate}>
                {new Date(entry.created_at).toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Dialog
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          style={styles.editDialog}>
          <Dialog.Title style={styles.editTitle}>Edit Symptom</Dialog.Title>

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
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <TextInput
              label="Symptom"
              value={editData?.symptom || ''}
              onChangeText={text => setEditData({...editData, symptom: text})}
              mode="outlined"
              style={styles.input}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <TextInput
              label="Note"
              value={editData?.note || ''}
              onChangeText={text => setEditData({...editData, note: text})}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
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
    borderRadius: 16,
    backgroundColor: '#FFEFF5',
    marginBottom: 30,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgb(218,79,122)',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 10,
  },
  noteInput: {
    minHeight: 100,
  },
  button: {
    backgroundColor: 'rgb(218,79,122)',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgb(218,79,122)',
    marginBottom: 10,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 5,
  },
  entryRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryText: {
    fontSize: 16,
    // fontWeight: '600',
    color: '#444',
  },
  entrySub: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  entrySubVal: {
    color: '#000',
  },
  entryNote: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButtonbg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a91e219',
  },
  deleteButtonbg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74d3c1d',
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
    color: '#fff',
  },
  saveButtonText: {
    color: '#fff',
  },
});
