import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
  Alert,
} from "react-native";
import { TextInput, Button, Card, Portal, Dialog } from "react-native-paper";
import { BASE_URL } from "@env";
import HeaderWithBack from "../Components/HeaderWithBack";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function SymptomsScreen() {
  const [week, setWeek] = useState("");
  const [symptom, setSymptom] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchSymptomsHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/symptoms`);
      const data = await res.json();
      setHistory(data.reverse());
    } catch (err) {
      console.error("Failed to fetch symptoms:", err);
    }
  };

  useEffect(() => {
    fetchSymptomsHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSymptomsHistory();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    await fetch(`${BASE_URL}/symptoms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_number: week, symptom, note }),
    });
    setWeek("");
    setSymptom("");
    setNote("");
    fetchSymptomsHistory();
  };

  const openEditModal = (entry) => {
    setEditData(entry);
    setEditVisible(true);
  };

  const handleUpdate = async () => {
    await fetch(`${BASE_URL}/symptoms/${editData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_number: editData.week_number,
        symptom: editData.symptom,
        note: editData.note,
      }),
    });
    setEditVisible(false);
    setEditData(null);
    fetchSymptomsHistory();
  };

  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(`${BASE_URL}/symptoms/${id}`, {
            method: "DELETE",
          });
          fetchSymptomsHistory();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Symptoms Tracker" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
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
            />
            <TextInput
              label="Symptom (e.g. Nausea)"
              value={symptom}
              onChangeText={setSymptom}
              mode="outlined"
              left={<TextInput.Icon icon="emoticon-sad-outline" />}
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
              labelStyle={{ fontWeight: "bold", color: "#fff" }}
            >
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
                  <Icon name="emoticon-sick-outline" size={20} color="rgb(218,79,122)" />
                  <Text style={styles.entryText}>  Week {entry.week_number}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Icon
                    name="pencil"
                    size={20}
                    color="#4a90e2"
                    onPress={() => openEditModal(entry)}
                    style={styles.iconButton}
                  />
                  <Icon
                    name="trash-can-outline"
                    size={20}
                    color="#e74c3c"
                    onPress={() => handleDelete(entry.id)}
                    style={styles.iconButton}
                  />
                </View>
              </View>
              <Text style={styles.entrySub}>Symptom: {entry.symptom}</Text>
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
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
          <Dialog.Title>Edit Symptom</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Week Number"
              value={editData?.week_number.toString() || ""}
              onChangeText={(text) =>
                setEditData({ ...editData, week_number: text })
              }
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Symptom"
              value={editData?.symptom || ""}
              onChangeText={(text) =>
                setEditData({ ...editData, symptom: text })
              }
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Note"
              value={editData?.note || ""}
              onChangeText={(text) =>
                setEditData({ ...editData, note: text })
              }
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
  container: { flex: 1, backgroundColor: "#FFF5F8" },
  content: { padding: 20, paddingBottom: 80 },

  formCard: {
    borderRadius: 16,
    backgroundColor: "#FFEFF5",
    marginBottom: 30,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgb(218,79,122)",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    backgroundColor: "white",
    marginBottom: 15,
    borderRadius: 10,
  },
  noteInput: {
    minHeight: 100,
  },
  button: {
    backgroundColor: "rgb(218,79,122)",
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "rgb(218,79,122)",
    marginBottom: 10,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    elevation: 3,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  entryRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  entrySub: {
    fontSize: 15,
    color: "#555",
    marginBottom: 2,
  },
  entryNote: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  entryDate: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 6,
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    marginLeft: 10,
  }
});
