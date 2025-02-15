import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function BasicDetailsScreen() {
  const navigation = useNavigation();

  // State for user inputs
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [mobileNumber, setMobileNumber] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // State for error messages
  const [errors, setErrors] = useState({ mobileNumber: "" });

  // Validate inputs
  const handleContinue = () => {
    let newErrors = {};

    if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
      newErrors.mobileNumber = "Enter a valid 10-digit number";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      navigation.replace("MainTabs");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios"); // Keep open on iOS, close on Android
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Details</Text>

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      {/* Mobile Number Input */}
      <TextInput
        style={[styles.input, errors.mobileNumber ? styles.errorBorder : null]}
        placeholder="Mobile Number"
        value={mobileNumber}
        onChangeText={(text) => {
          setMobileNumber(text);
          setErrors((prev) => ({ ...prev, mobileNumber: "" }));
        }}
        keyboardType="numeric"
        maxLength={10}
      />
      {errors.mobileNumber ? <Text style={styles.errorText}>{errors.mobileNumber}</Text> : null}

      {/* Due Date Input (Floating Calendar) */}
      <TouchableOpacity
        style={[styles.input, styles.dateInput]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>{dueDate.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "calendar"}
          onChange={handleDateChange}
        />
      )}

      {/* Continue Button */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  dateInput: {
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  errorBorder: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#ff4081",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
