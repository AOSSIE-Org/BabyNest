 // src/components/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  Platform,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Modal, Portal, Button, Provider } from 'react-native-paper'; // Import from paper
import CustomHeader from '../Components/CustomHeader';
import { BASE_URL } from '@env';

const { width } = Dimensions.get('window');

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
  const [profileData, setProfileData] = useState({
    name: 'Guest',
    due_date: 'Not set',
    location: 'Not set'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profile data from backend
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_profile`);
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.name || 'Guest',
          due_date: data.due_date || 'Not set',
          location: data.location || 'Not set'
        });
      } else {
        // If profile not found, keep default values
        console.log('Profile not found, using default values');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'This will open the profile editing screen. For now, you can refresh to see updated data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Refresh', onPress: onRefresh }
      ]
    );
  };

  return (
    <Provider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ScrollView 
          style={[styles.container, { backgroundColor: theme.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <CustomHeader />

          <View style={styles.header}>
            <Image
              source={require('../assets/Avatar.jpeg')}
              style={styles.profileImage}
            />
            <Text style={[styles.name, { color: theme.text }]}>
              {loading ? 'Loading...' : profileData.name}
            </Text>
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
              <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
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
              </ScrollView>
            </Modal>
          </Portal>

          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
            <ProfileField label="Due Date" value={loading ? 'Loading...' : profileData.due_date} />
            <ProfileField label="Location" value={loading ? 'Loading...' : profileData.location} />
          </View>

          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.primary }]}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    flexGrow: 1,
  },
  openButton: {
    backgroundColor: '#6200EE',
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 0,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  openButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    maxHeight: Platform.OS === 'ios' ? '80%' : '90%',
    width: width - 40,
    alignSelf: 'center',
  },
  modalScrollContent: {
    maxHeight: Platform.OS === 'ios' ? 500 : 600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: Platform.OS === 'ios' ? 20 : 40,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 8,
  },
  iconContainer: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    width: 110,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 22,
  },
  iconLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 0,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 0.4,
  },
  fieldValue: {
    fontSize: 15,
    opacity: 0.7,
    flex: 0.6,
    textAlign: 'right',
  },
  editButton: {
    marginHorizontal: 0,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    padding: 13,
    marginVertical: 8,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 15,
  },
  closeButton: {
    marginTop: 12,
  },
});



