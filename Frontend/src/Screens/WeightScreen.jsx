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
import {weightApi} from '../services/weightApi';
import dayjs from 'dayjs';

export default function WeightScreen() {
  const [week, setWeek] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    week_number: '',
    weight: '',
    note: '',
  });

  const [loading, setLoading] = useState(false);

  const fetchWeightHistory = async () => {
    try {
      setLoading(true);
      const data = await weightApi.getAll();
      setHistory([...data].reverse());
    } catch (err) {
      console.error('Failed to fetch weights:', err);
      Alert.alert('Error', `unable to laod weight history`);
    } finally {
      setLoading(false);
    }
  };

  const formatLocalDate = utcDateString => {
    if (!utcDateString) return '';
    const date = dayjs(utcDateString); // automatically parses ISO strings
    if (!date.isValid()) return 'Invalid date';
    return date.format('YYYY-MM-DD HH:mm:ss');
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
    const weekNum = Number(week);
    const weightNum = Number(weight);

    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 40) {
      Alert.alert('Invalid week', 'Week must be between 1 and 40');
      return;
    }

    if (weightNum <= 0) {
      Alert.alert('Invalid weight', 'Weight must be greater than 0');
      return;
    }

    const tempId = Date.now(); // temporary id for optimistic UI
    const newEntry = {
      id: tempId,
      week_number: weekNum,
      weight: weightNum,
      note,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setHistory(prev => [newEntry, ...prev]);

    try {
      const savedEntry = await weightApi.create({
        week_number: weekNum,
        weight: weightNum,
        note,
      });
      // Replace temp entry with real id from server
      setHistory(prev => prev.map(e => (e.id === tempId ? savedEntry : e)));
    } catch (err) {
      setHistory(prev => prev.filter(e => e.id !== tempId));
      console.error('Failed to save weight:', err);
      Alert.alert('Error', 'Failed to save weight entry. Please try again.');
    } finally {
      setWeek('');
      setWeight('');
      setNote('');
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
            const prevHistory = [...history];
            setHistory(prev => prev.filter(e => e.id !== id));
            try {
              await weightApi.remove(id);
            } catch (err) {
              setHistory(prevHistory);
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
    const weekNum = Number(editData.week_number);
    const weightNum = Number(editData.weight);

    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 40) {
      Alert.alert('Invalid week', 'Week must be between 1 and 40');
      return;
    }

    if (weightNum <= 0) {
      Alert.alert('Invalid weight', 'Weight must be greater than 0');
      return;
    }

    const prevHistory = [...history];
    setHistory(prev =>
      prev.map(e =>
        e.id === editData.id
          ? {...e, week_number: weekNum, weight: weightNum, note: editData.note}
          : e,
      ),
    );
    try {
      await weightApi.update(editData.id, {
        week_number: weekNum,
        weight: weightNum,
        note: editData.note,
      });
    } catch (err) {
      setHistory(prevHistory);
      console.error('Failed to update weight:', err);
      Alert.alert('Error', 'Failed to update entry. Please try again.');
    } finally {
      setEditVisible(false);
      setEditData({
        id: null,
        week_number: '',
        weight: '',
        note: '',
      });
    }
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Weight Tracker" />
      {loading && (
        <View style={{paddingVertical: 30}}>
          <Text style={{textAlign: 'center'}}>Loading weight history</Text>
        </View>
      )}
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
              disabled={loading}
              style={styles.button}
              labelStyle={{fontWeight: 'bold', color: '#fff'}}>
              Save Entry
            </Button>
          </Card.Content>
        </Card>

        {!loading && history.length === 0 && (
          <Text style={{textAlign: 'center', marginTop: 20, color: '#777'}}>
            No weight entries yet. Add your first entry above.
          </Text>
        )}
        {/* History */}
        <Text style={styles.historyTitle}>Your Weight History</Text>
        {history.map(entry => (
          <Card key={entry.id} style={styles.entryCard}>
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
