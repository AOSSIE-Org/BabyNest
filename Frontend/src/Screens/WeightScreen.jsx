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
import {BASE_URL} from '@env';
import HeaderWithBack from '../Components/HeaderWithBack';
import Icon from 'react-native-vector-icons/Ionicons';

export default function WeightScreen() {
  const [week, setWeek] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchWeightHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/weight`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await res.json();
      setHistory(data.reverse());
    } catch (err) {
      console.error('Failed to fetch weights:', err);
    }
  };
 

  const formatLocalDate = (utcDateString) => {
    if (!utcDateString) return '';
    const dateStringWithZ = utcDateString.endsWith('Z') ? utcDateString : `${utcDateString}Z`;
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
    fetchWeightHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWeightHistory();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!week || !weight) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await fetch(`${BASE_URL}/weight`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({week_number: week, weight, note}),
      });
      setWeek('');
      setWeight('');
      setNote('');
      fetchWeightHistory();
    } catch (err) {
      console.error('Failed to save weight:', err);
      Alert.alert('Error', 'Failed to save weight entry. Please try again.');
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
              await fetch(`${BASE_URL}/weight/${id}`, {
                method: 'DELETE',
              });
              fetchWeightHistory();
            } catch (err) {
              console.error('Failed to delete weight:', err);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
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
      await fetch(`${BASE_URL}/weight/${editData.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          week_number: editData.week_number,
          weight: editData.weight,
          note: editData.note,
        }),
      });
      setEditVisible(false);
      setEditData(null);
      fetchWeightHistory();
    } catch (err) {
      console.error('Failed to update weight:', err);
      Alert.alert('Error', 'Failed to update entry. Please try again.');
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
             />
            <TextInput
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="weight-kilogram" />}
              style={styles.input}
            />
            <TextInput
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              mode="outlined"
              style={[styles.input, styles.noteInput]}
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
                  <Icon
                    name="create-outline"
                    size={20}
                    color="#4a90e2"
                    onPress={() => openEditModal(entry)}
                    style={styles.iconButton}
                  />
                  <Icon
                    name="trash-outline"
                    size={20}
                    color="#e74c3c"
                    onPress={() => handleDelete(entry.id)}
                    style={styles.iconButton}
                  />
                </View>
              </View>

              <Text style={styles.entrySub}>Weight: {entry.weight} kg</Text>
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
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
          <Dialog.Title>Edit Entry</Dialog.Title>
          <Dialog.Content >
            <TextInput
              label="Week Number"
              value={editData?.week_number?.toString() || ''}
              onChangeText={text =>
                setEditData({...editData, week_number: text})
              }
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Weight"
              value={editData?.weight?.toString() || ''}
              onChangeText={text => setEditData({...editData, weight: text})}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Note"
              value={editData?.note || ''}
              onChangeText={text => setEditData({...editData, note: text})}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdate}>Save</Button>
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
    marginBottom: 4,
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
    marginTop: 6,
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
