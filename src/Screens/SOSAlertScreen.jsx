import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";

export default SOSAlertScreen = ({ navigation }) => {
  const [tapCount, setTapCount] = useState(0);

  const handleTap = () => {
    if (tapCount >= 3) {
      navigation.navigate("EmergencyCalling");
    } else {
      setTapCount(tapCount + 1);
    }
  };

  return (
    <TouchableOpacity style={styles.alertContainer} onPress={handleTap}>
      <View style={styles.alertCircle}>
        <Icon name="power" size={60} color="white" />
      </View>
      <Text style={styles.alertText}>Tap 4 Times on Screen to Alert</Text>
      <Text style={styles.subText}>Taps: {tapCount}</Text>
    </TouchableOpacity>
  );
};



// Styles
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  sosButton: { backgroundColor: "#FF6F61", padding: 20, borderRadius: 50, flexDirection: "row", alignItems: "center" },
  sosText: { color: "white", fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  alertContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFE8E5" },
  alertCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: "#FF6F61", justifyContent: "center", alignItems: "center" },
  alertText: { fontSize: 18, fontWeight: "bold", marginTop: 20 },
  subText: { fontSize: 16, color: "gray", marginTop: 10 },
  callingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FF6F61" },
  callingText: { fontSize: 20, color: "white", marginBottom: 20 },
  callingCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "white", justifyContent: "center", alignItems: "center" },
  counter: { fontSize: 40, fontWeight: "bold", color: "#FF6F61" },
  contacts: { flexDirection: "row", marginTop: 20 },
  contactImage: { width: 50, height: 50, borderRadius: 25, marginHorizontal: 10 },
  safeButton: { marginTop: 30, backgroundColor: "white", padding: 15, borderRadius: 10 },
  safeText: { fontSize: 16, fontWeight: "bold", color: "#FF6F61" },
});
