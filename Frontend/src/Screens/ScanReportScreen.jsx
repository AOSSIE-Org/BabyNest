import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'react-native-image-picker';

// Using your actual machine IP for simulator-to-backend connectivity
const BASE_URL = 'http://10.72.82.230:5050';

export default function ScanReportScreen() {
  const [loading, setLoading] = useState(false);

  const pickImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, async (response) => {
      if (response.assets) {
        setLoading(true);
        const imageUri = response.assets[0].uri;
        uploadAndScan(imageUri);
      }
    });
  };

  const saveToDatabase = async (cleanData) => {
    setLoading(true);
    try {
      const weight = cleanData.weight;
      const bp = cleanData.bp || cleanData.blood_pressure;

      if (weight && weight !== "N/A") {
        await fetch(`${BASE_URL}/api/weight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight: weight, user_id: 'default' }),
        });
      }

      if (bp && bp !== "N/A") {
        await fetch(`${BASE_URL}/api/blood-pressure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bp: bp, user_id: 'default' }),
        });
      }

      setLoading(false);
      Alert.alert("Success", "Medical data has been logged to your profile.");
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Failed to save data to database.");
    }
  };

  const uploadAndScan = async (uri) => {
  setLoading(true);
  try {
    // Base64 conversion using react-native-image-picker capability
    const options = {
      mediaType: 'photo',
      quality: 0.8, 
      includeBase64: true,
    };

    ImagePicker.launchImageLibrary(options, async (response) => {
      if (response.didCancel || response.errorCode) {
        setLoading(false);
        return;
      }

      const base64Image = response.assets[0].base64;

      const res = await fetch(`${BASE_URL}/api/ocr-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.status === "success") {
        const { weight, bp, appointment } = data.extracted_values;
        Alert.alert(
          "Verify Extracted Data",
          `Weight: ${weight || "N/A"} kg\nBP: ${bp || "N/A"}\nNext Appt: ${appointment || "N/A"}`,
          [
            { text: "Discard", style: "destructive" },
            { text: "Confirm & Save", onPress: () => saveToDatabase({ weight, bp, appointment }) }
          ]
        );
      } else {
        Alert.alert("Error", data.message || "Extraction failed");
      }
    });
  } catch (err) {
    setLoading(false);
    Alert.alert("Network Error", "Verify backend is running and reachable.");
  }
};

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="rgb(218,79,122)" />
          <Text style={{ marginTop: 15, color: 'rgb(218,79,122)' }}>Processing medical report...</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={pickImage} style={styles.button}>
          <Text style={styles.buttonText}>SELECT REPORT FROM GALLERY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F8' },
  button: { backgroundColor: 'rgb(218,79,122)', padding: 20, borderRadius: 12, elevation: 5 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});