import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './ProfileScreen.styles';

interface ProfileData {
  name: string;
  email: string;
  dueDate: string;
  country: string;
  isDarkMode: boolean;
}

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'John Doe',
    email: 'john@example.com',
    dueDate: '2025-06-15',
    country: 'United States',
    isDarkMode: false,
  });

  const handleThemeToggle = (value: boolean) => {
    setProfileData({ ...profileData, isDarkMode: value });
  };

  const handleDueDateChange = (value: string) => {
    setProfileData({ ...profileData, dueDate: value });
  };

  const handleCountryChange = (value: string) => {
    setProfileData({ ...profileData, country: value });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top : 0,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarPlaceholder}>👶</Text>
          </View>
          <Text style={styles.userName}>{profileData.name}</Text>
          <Text style={styles.userEmail}>{profileData.email}</Text>
        </View>

        {/* Change Theme Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Theme Settings</Text>
          </View>
          <View style={styles.themeCard}>
            <View style={styles.themeContent}>
              <Text style={styles.themeLabel}>Dark Mode</Text>
              <Text style={styles.themeDescription}>
                Enable dark theme for better night viewing
              </Text>
            </View>
            <Switch
              value={profileData.isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#E5E5EA', true: '#81C784' }}
              thumbColor={profileData.isDarkMode ? '#4CAF50' : '#F1F1F1'}
              style={styles.switchControl}
            />
          </View>
        </View>

        {/* Due Date Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Due Date</Text>
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Expected Due Date</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999999"
                value={profileData.dueDate}
                onChangeText={handleDueDateChange}
                editable={true}
              />
              <Text style={styles.inputIcon}>📅</Text>
            </View>
            <Text style={styles.inputHelperText}>
              Format: YYYY-MM-DD (e.g., 2025-06-15)
            </Text>
          </View>
        </View>

        {/* Country Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Country</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your country"
                placeholderTextColor="#999999"
                value={profileData.country}
                onChangeText={handleCountryChange}
                editable={true}
              />
              <Text style={styles.inputIcon}>🌍</Text>
            </View>
            <Text style={styles.inputHelperText}>
              Your location helps us provide localized content
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoText}>Last updated: Today</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
