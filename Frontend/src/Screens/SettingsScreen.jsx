 // src/components/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Modal, Portal, Button, Provider } from 'react-native-paper'; // Import from paper
import CustomHeader from '../Components/CustomHeader';

const IconButton = ({ icon, label }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.iconContainer, { backgroundColor: theme.iconBackground }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={[styles.iconLabel, { color: theme.iconText || theme.text}]}>{label}</Text>
    </View>
  );
};

const ProfileField = ({ label, value }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
};

export default function SettingsScreen() {
  const { theme, updateTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Provider>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        <CustomHeader />

        <View style={styles.header}>
          <Image
            source={require('../assets/Avatar.jpeg')}
            style={styles.profileImage}
          />
          <Text style={[styles.name, { color: theme.text }]}>Ishaan Gupta</Text>
        </View>

        <View style={styles.iconsRow}>
          <IconButton icon="🔔" label="Notification" />
        </View>

        <TouchableOpacity style={[styles.openButton,{backgroundColor:theme.button}]} onPress={() => setModalVisible(true)}>
          <Text style={styles.openButtonText}>Change Theme</Text>
        </TouchableOpacity>

        {/* Theme Selection Modal */}
        <Portal>
          <Modal 
            visible={modalVisible} 
            onDismiss={() => setModalVisible(false)} 
            contentContainerStyle={[styles.modalContent, { backgroundColor: theme.factcardprimary }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select a Theme</Text>

            {/* Theme Selection Buttons */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'rgb(255, 148, 182)' }]}
              onPress={() => { updateTheme('light'); setModalVisible(false); }}
            >
              <Text style={styles.buttonText}>Light Theme</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor:'#fff3b0', }]}
              onPress={() => { updateTheme('dark'); setModalVisible(false); }}
            >
              <Text style={styles.buttonText}>Dark Theme</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#AC87C5'}]}
              onPress={() => { updateTheme('pastel'); setModalVisible(false); }}
            >
              <Text style={styles.buttonText}>Pastel Theme</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff4081' }]}
              onPress={() => { updateTheme('default'); setModalVisible(false); }}
            >
              <Text style={styles.buttonText}>Default Theme</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.closeButton}>
              Close
            </Button>
          </Modal>
        </Portal>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
          <ProfileField label="Due Date" value="1234-123-5674" />
          <ProfileField label="Country" value="India" />
        </View>

        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  openButton: {
    backgroundColor: '#6200EE',
    padding: 12,
    borderRadius: 8,
  },
  openButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 70,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  iconContainer: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    width: 100,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  iconText: {
    fontSize: 20,
  },
  iconLabel: {
    fontSize: 14,
  },
  infoCard: {
    margin: 15,
    padding: 15,
    borderRadius: 15,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fieldLabel: {
    fontSize: 16,
  },
  fieldValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  editButton: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    padding: 12,
    marginVertical: 5,
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
  },
});



