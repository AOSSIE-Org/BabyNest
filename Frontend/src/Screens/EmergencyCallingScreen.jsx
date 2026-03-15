import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";

const EMERGENCY_NUMBER = "911";

export default EmergencyCallingScreen = ({ navigation }) => {
  const [isCalling, setIsCalling] = useState(false);

  const handleEmergencyCall = () => {
    setIsCalling(true);
    Alert.alert(
      'Emergency Call',
      `Calling ${EMERGENCY_NUMBER}...`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsCalling(false) },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${EMERGENCY_NUMBER}`).catch(err => {
              Alert.alert('Error', 'Unable to make phone call');
              setIsCalling(false);
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.callingContainer}>
      <Text style={styles.callingText}>
        {isCalling ? 'Calling Emergency Services...' : 'Emergency Mode Activated'}
      </Text>
      
      <TouchableOpacity 
        style={styles.callingCircle} 
        onPress={handleEmergencyCall}
        disabled={isCalling}
      >
        <Icon name="call" size={50} color="#FF6F61" />
      </TouchableOpacity>
      
      <Text style={styles.instructionText}>
        Tap to call {EMERGENCY_NUMBER}
      </Text>
      
      <View style={styles.contacts}>
        <Text style={styles.contactLabel}>Emergency Contacts</Text>
        <View style={styles.contactRow}>
          <View style={styles.contactItem}>
            <View style={styles.contactPlaceholder}>
              <Text style={styles.contactInitial}>1</Text>
            </View>
            <Text style={styles.contactName}>Contact 1</Text>
          </View>
          <View style={styles.contactItem}>
            <View style={styles.contactPlaceholder}>
              <Text style={styles.contactInitial}>2</Text>
            </View>
            <Text style={styles.contactName}>Contact 2</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.safeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.safeText}>I AM SAFE</Text>
      </TouchableOpacity>
    </View>
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
  callingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FF6F61", padding: 20 },
  callingText: { fontSize: 22, color: "white", marginBottom: 30, fontWeight: "bold", textAlign: "center' },
  instructionText: { fontSize: 16, color: "white", marginTop: 15, marginBottom: 30 },
  callingCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "white", justifyContent: "center", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  counter: { fontSize: 40, fontWeight: "bold", color: "#FF6F61" },
  contacts: { marginTop: 30, alignItems: "center" },
  contactLabel: { fontSize: 16, color: "white", fontWeight: "bold", marginBottom: 15 },
  contactRow: { flexDirection: "row", justifyContent: "center" },
  contactItem: { alignItems: "center", marginHorizontal: 15 },
  contactPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center" },
  contactInitial: { fontSize: 18, color: "white", fontWeight: "bold" },
  contactName: { fontSize: 12, color: "white", marginTop: 5 },
  contactImage: { width: 50, height: 50, borderRadius: 25, marginHorizontal: 10 },
  safeButton: { marginTop: 40, backgroundColor: "white", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 },
  safeText: { fontSize: 18, fontWeight: "bold", color: "#FF6F61" },
});
