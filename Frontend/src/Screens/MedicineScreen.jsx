import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
} from "react-native";
import { TextInput, Button, Card } from "react-native-paper";
import { BASE_URL } from "@env";
import HeaderWithBack from "../Components/HeaderWithBack";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function MedicineScreen() {
  const [week, setWeek] = useState("");
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedicineHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_medicine`);
      const data = await res.json();
      setHistory(data.reverse());
    } catch (err) {
      console.error("Failed to fetch medicine records:", err);
    }
  };

  useEffect(() => {
    fetchMedicineHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedicineHistory();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    await fetch(`${BASE_URL}/set_medicine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_number: week, name, dose, time, note }),
    });
    setWeek("");
    setName("");
    setDose("");
    setTime("");
    setNote("");
    fetchMedicineHistory();
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Medicine Tracker" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Medicine</Text>

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
              label="Medicine Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              left={<TextInput.Icon icon="pill" />}
              style={styles.input}
            />
            <TextInput
              label="Dose (e.g. 500mg)"
              value={dose}
              onChangeText={setDose}
              mode="outlined"
              left={<TextInput.Icon icon="medical-bag" />}
              style={styles.input}
            />
            <TextInput
              label="Time (Morning/Evening)"
              value={time}
              onChangeText={setTime}
              mode="outlined"
              left={<TextInput.Icon icon="clock" />}
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
              Save Entry
            </Button>
          </Card.Content>
        </Card>

        {/* History */}
        <Text style={styles.historyTitle}>Medicine History</Text>
        {history.map((entry, index) => (
          <Card key={index} style={styles.entryCard}>
            <Card.Content>
              <View style={styles.entryRow}>
                <Icon name="medication" size={20} color="rgb(218,79,122)" />
                <Text style={styles.entryText}>
                  {" "}
                  Week {entry.week_number} - {entry.name}
                </Text>
              </View>
              <Text style={styles.entrySub}>Dose: {entry.dose}</Text>
              <Text style={styles.entrySub}>Time: {entry.time}</Text>
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
});
