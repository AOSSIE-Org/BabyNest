import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Text, RefreshControl } from "react-native";
import { TextInput, Button, Card } from "react-native-paper";
import HeaderWithBack from "../Components/HeaderWithBack";
import { BASE_URL } from "@env";

export default function BloodPressureScreen() {
  const [week, setWeek] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBPLogs = async () => {
    const res = await fetch(`${BASE_URL}/get_bp_logs`);
    const data = await res.json();
    setHistory(data.reverse());
  };

  useEffect(() => { fetchBPLogs(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBPLogs();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    await fetch(`${BASE_URL}/set_bp_log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_number: week, systolic, diastolic, time, note }),
    });
    setWeek(""); setSystolic(""); setDiastolic(""); setTime(""); setNote("");
    fetchBPLogs();
  };

  return (
    <View style={styles.container}>
      <HeaderWithBack title="Blood Pressure Tracker" />
      <ScrollView contentContainerStyle={styles.content} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Blood Pressure</Text>
            <TextInput label="Week Number" value={week} onChangeText={setWeek} keyboardType="numeric" mode="outlined" style={styles.input} />
            <TextInput label="Systolic" value={systolic} onChangeText={setSystolic} keyboardType="numeric" mode="outlined" style={styles.input} />
            <TextInput label="Diastolic" value={diastolic} onChangeText={setDiastolic} keyboardType="numeric" mode="outlined" style={styles.input} />
            <TextInput label="Time (Morning/Evening)" value={time} onChangeText={setTime} mode="outlined" style={styles.input} />
            <TextInput label="Note" value={note} onChangeText={setNote} multiline numberOfLines={3} mode="outlined" style={styles.input} />
            <Button mode="contained" onPress={handleSubmit} style={styles.button}>Save Entry</Button>
          </Card.Content>
        </Card>

        <Text style={styles.historyTitle}>Blood Pressure History</Text>
        {history.map((entry, index) => (
          <Card key={index} style={styles.entryCard}>
            <Card.Content>
              <Text style={styles.entryText}>Week {entry.week_number} - {entry.systolic}/{entry.diastolic} mmHg</Text>
              <Text>Time: {entry.time}</Text>
              {entry.note && <Text style={styles.entryNote}>Note: {entry.note}</Text>}
              <Text style={styles.entryDate}>{new Date(entry.created_at).toLocaleString()}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F8" },
  content: { padding: 20 },
  formCard: { backgroundColor: "#FFEFF5", borderRadius: 16, marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "rgb(218,79,122)", marginBottom: 10, textAlign: "center" },
  input: { backgroundColor: "white", marginBottom: 15 },
  button: { backgroundColor: "rgb(218,79,122)", paddingVertical: 8, borderRadius: 10 },
  historyTitle: { fontSize: 18, fontWeight: "bold", color: "rgb(218,79,122)", marginBottom: 10 },
  entryCard: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 15, padding: 10 },
  entryText: { fontSize: 16, fontWeight: "600" },
  entryNote: { fontSize: 14, color: "#777" },
  entryDate: { fontSize: 12, color: "#aaa", marginTop: 5 },
});
