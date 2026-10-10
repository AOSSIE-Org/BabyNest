import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import {TextInput, Button, Card, Dialog, Portal} from 'react-native-paper';
import HeaderWithBack from '../Components/HeaderWithBack';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  addWeight,
  deleteWeight,
  getAllWeights,
  updateWeight,
} from '../storage/weight';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function WeightScreen() {
  const [week, setWeek] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [user_id, setUser_id] = useState(null);

  const fetchWeightHistory = async userId => {
    try {
      const getAllWeights_res = await getAllWeights(userId);

      if (!getAllWeights_res.success) {
        throw new Error(getAllWeights_res.error.message);
      }

      const data = getAllWeights_res.data;
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch weights:', err);
    }
  };

  const formatLocalDate = utcDateString => {
    if (!utcDateString) return '';
    const dateStringWithZ = utcDateString.endsWith('Z')
      ? utcDateString
      : `${utcDateString}Z`;
    const date = new Date(dateStringWithZ);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
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

        await fetchWeightHistory(userId);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWeightHistory(user_id);
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!week || !weight) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const addWeight_res = await addWeight(user_id, {
        week_number: week,
        weight,
        note,
      });
      if (!addWeight_res.success) {
        Toast.show({
          type: 'error',
          text1: addWeight_res.error.message || 'Error add weight!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(addWeight_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'Weight added successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      setWeek('');
      setWeight('');
      setNote('');
      fetchWeightHistory(user_id);
    } catch (err) {
      console.error('Failed to save weight:', err);
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
              const deleteWeight_res = await deleteWeight(user_id, id);
              if (!deleteWeight_res.success) {
                Toast.show({
                  type: 'error',
                  text1:
                    deleteWeight_res.error.message || 'Error deleting weight!',
                  visibilityTime: 2000,
                  position: 'bottom',
                  topOffset: 50,
                });
                throw new Error(deleteWeight_res.error.message);
              }

              Toast.show({
                type: 'success',
                text1: 'Weight deleted successfully!',
                visibilityTime: 2000,
                position: 'bottom',
                topOffset: 50,
              });
              fetchWeightHistory(user_id);
            } catch (err) {
              console.error('Failed to delete weight:', err);
            }
          },
        },
      ],
    );
  };

  const openEditModal = entry => {
    setEditData(entry);
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const updateWeight_res = await updateWeight(user_id, editData.id, {
        week_number: editData.week_number,
        weight: editData.weight,
        note: editData.note,
      });
      if (!updateWeight_res.success) {
        Toast.show({
          type: 'error',
          text1: updateWeight_res.error.message || 'Error update weight!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        throw new Error(updateWeight_res.error.message);
      }
      Toast.show({
        type: 'success',
        text1: 'Weight updated successfully!',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
      setEditVisible(false);
      setEditData(null);
      fetchWeightHistory(user_id);
    } catch (err) {
      console.error('Failed to update weight:', err);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Weight Tracker" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Your Weight</Text>

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
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="weight-kilogram" />}
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
              Save Entry
            </Button>
          </Card.Content>
        </Card>

        {/* History */}
        <Text style={styles.historyTitle}>Your Weight History</Text>
        {history.map((entry, index) => (
          <Card key={index} style={styles.entryCard}>
            <Card.Content>
              <View style={styles.entryRowBetween}>
                <View style={styles.entryRow}>
                  <Icon name="calendar" size={20} color="rgb(218,79,122)" />
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
                      name="trash"
                      size={20}
                      color="#e74c3c"
                      onPress={() => handleDelete(entry.id)}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.entrySub}>
                Weight:{' '}
                <Text style={{fontWeight: '500'}}>{entry.weight} kg</Text>
              </Text>
              {entry.note ? (
                <Text style={styles.entryNote}>Note: {entry.note}</Text>
              ) : null}
              <Text style={styles.entryDate}>
                {formatLocalDate(entry.created_at)}
              </Text>
            </Card.Content>
          </Card>
        ))}
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
              textColor="#454545"
              outlineStyle={styles.inputOutline}
              activeOutlineColor="rgb(218,79,122)"
            />

            <TextInput
              label="Weight"
              value={editData?.weight?.toString() || ''}
              onChangeText={text => setEditData({...editData, weight: text})}
              keyboardType="numeric"
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
              onPress={handleUpdate}
              mode="contained"
              buttonColor="rgba(218, 79, 123, 0.95)"
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
    backgroundColor: '#FFEEF2',
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    elevation: 3,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  entryRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  entrySub: {
    fontSize: 15,
    color: '#555',
    marginBottom: 2,
  },
  entryNote: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 5,
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  editButtonbg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a91e227',
  },
  iconButton: {
    marginLeft: 2,
  },
  deleteButtonbg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74d3c2c',
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
});
