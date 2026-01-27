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
import Icon from 'react-native-vector-icons/Ionicons';
import {BASE_URL} from '@env';
import HeaderWithBack from '../Components/HeaderWithBack';

export default function DischargeScreen() {
  const [week, setWeek] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('');
  const [bleeding, setBleeding] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchDischargeLogs = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_discharge_logs`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch discharge logs:', err);
      Alert.alert('Error', 'Failed to load discharge logs. Please try again.');
    }
  };

  useEffect(() => {
    fetchDischargeLogs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDischargeLogs();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!week || !type || !color || !bleeding) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/set_discharge_log`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({week_number: week, type, color, bleeding, note}),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setWeek('');
      setType('');
      setColor('');
      setBleeding('');
      setNote('');
      fetchDischargeLogs();
    } catch (err) {
      console.error('Failed to add discharge log:', err);
      Alert.alert('Error', 'Failed to save discharge log. Please try again.');
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
              const res = await fetch(`${BASE_URL}/discharge_log/${id}`, {
                method: 'DELETE',
              });

              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }

              fetchDischargeLogs();
            } catch (err) {
              console.error('Failed to delete entry:', err);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
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
      const res = await fetch(`${BASE_URL}/discharge_log/${editData.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          week_number: editData.week_number,
          type: editData.type,
          color: editData.color,
          bleeding: editData.bleeding,
          note: editData.note,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setEditVisible(false);
      setEditData(null);
      fetchDischargeLogs();
    } catch (err) {
      console.error('Failed to update entry:', err);
      Alert.alert('Error', 'Failed to update discharge log. Please try again.');
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
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
            />
            <TextInput
              label="Type"
              value={type}
              onChangeText={setType}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="file-tray-full" />}
            />
            <TextInput
              label="Color"
              value={color}
              onChangeText={setColor}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="color-palette" />}
            />
            <TextInput
              label="Bleeding"
              value={bleeding}
              onChangeText={setBleeding}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="water" />}
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
        <Text style={styles.historyTitle}>Discharge History</Text>
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

              <Text style={styles.entrySub}>Type: {entry.type}</Text>
              <Text style={styles.entrySub}>Color: {entry.color}</Text>
              <Text style={styles.entrySub}>Bleeding: {entry.bleeding}</Text>
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

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
          <Dialog.Title>Edit Entry</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Week Number"
              value={editData?.week_number || ''}
              onChangeText={text =>
                setEditData({...editData, week_number: text})
              }
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Type"
              value={editData?.type || ''}
              onChangeText={text => setEditData({...editData, type: text})}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Color"
              value={editData?.color || ''}
              onChangeText={text => setEditData({...editData, color: text})}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Bleeding"
              value={editData?.bleeding || ''}
              onChangeText={text => setEditData({...editData, bleeding: text})}
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
