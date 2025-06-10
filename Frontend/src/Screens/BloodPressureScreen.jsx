import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {TextInput, Button, Card, Portal, Dialog} from 'react-native-paper';
import HeaderWithBack from '../Components/HeaderWithBack';
import {BASE_URL} from '@env';

export default function BloodPressureScreen() {
  const [week, setWeek] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  //Edit Modal State
  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchBPLogs = async () => {
    try {
      const res = await fetch(`${BASE_URL}/blood_pressure`);
      const data = await res.json();
      setHistory(data.reverse());
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
      await fetch(`${BASE_URL}/set_bp_log`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          week_number: week,
          systolic,
          diastolic,
          time,
          note,
        }),
      });
      setWeek('');
      setSystolic('');
      setDiastolic('');
      setTime('');
      setNote('');
      fetchBPLogs();
    } catch (err) {
      console.error('Failed to save BP log:', err);
      Alert.alert(
        'Error',
        'Failed to save blood pressure entry. Please try again.',
      );
    }
  };

  const openEditModal = entry => {
    setEditData(entry);
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    try {
      await fetch(`${BASE_URL}/blood_pressure/${editData.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          week_number: editData.week_number,
          systolic: editData.systolic,
          diastolic: editData.diastolic,
          time: editData.time,
          note: editData.note,
        }),
      });
      setEditVisible(false);
      setEditData(null);
      fetchBPLogs();
    } catch (err) {
      console.error('Failed to update BP log:', err);
      Alert.alert(
        'Error',
        'Failed to update blood pressure entry. Please try again.',
      );
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
              await fetch(`${BASE_URL}/blood_pressure/${id}`, {
                method: 'DELETE',
              });
              fetchBPLogs();
            } catch (err) {
              console.error('Failed to delete BP log:', err);
              Alert.alert(
                'Error',
                'Failed to delete blood pressure entry. Please try again.',
              );
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
            />
            <TextInput
              label="Systolic"
              value={systolic}
              onChangeText={setSystolic}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Diastolic"
              value={diastolic}
              onChangeText={setDiastolic}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Time (Morning/Evening)"
              value={time}
              onChangeText={setTime}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Note"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}>
              Save Entry
            </Button>
          </Card.Content>
        </Card>

        <Text style={styles.historyTitle}>Blood Pressure History</Text>
        {history.map((entry, index) => (
          <Card key={index} style={styles.entryCard}>
            <Card.Content>
              <View style={styles.entryRowBetween}>
                <Text style={styles.entryText}>
                  Week {entry.week_number} - {entry.systolic}/{entry.diastolic}{' '}
                  mmHg
                </Text>
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
              <Text>Time: {entry.time}</Text>
              {entry.note && (
                <Text style={styles.entryNote}>Note: {entry.note}</Text>
              )}
              <Text style={styles.entryDate}>
                {new Date(entry.created_at).toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

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
              label="Systolic"
              value={editData?.systolic?.toString() || ''}
              onChangeText={text => setEditData({...editData, systolic: text})}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Diastolic"
              value={editData?.diastolic?.toString() || ''}
              onChangeText={text => setEditData({...editData, diastolic: text})}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Time"
              value={editData?.time || ''}
              onChangeText={text => setEditData({...editData, time: text})}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Note"
              value={editData?.note || ''}
              onChangeText={text => setEditData({...editData, note: text})}
              mode="outlined"
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
  content: {padding: 20},
  formCard: {backgroundColor: '#FFEFF5', borderRadius: 16, marginBottom: 30},
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgb(218,79,122)',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {backgroundColor: 'white', marginBottom: 15},
  button: {
    backgroundColor: 'rgb(218,79,122)',
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
    padding: 10,
  },
  entryRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryText: {fontSize: 16, fontWeight: '600'},
  entryNote: {fontSize: 14, color: '#777', marginTop: 5},
  entryDate: {fontSize: 12, color: '#aaa', marginTop: 5},
  iconRow: {flexDirection: 'row', gap: 10},
  iconButton: {marginLeft: 10},
});
