import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '@env';

const ProfileField = ({ label, value }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState({
    name: 'Guest',
    due_date: 'Not set',
    location: 'Not set',
    lmp: 'Not set',
    age: 'Not set',
    weight: 'Not set',
    cycle_length: 'Not set',
    period_length: 'Not set',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_profile`);
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.name || 'Guest',
          due_date: data.due_date || 'Not set',
          location: data.location || 'Not set',
          lmp: data.lmp || 'Not set',
          age: data.age ? String(data.age) : 'Not set',
          weight: data.weight ? `${data.weight} kg` : 'Not set',
          cycle_length: data.cycle_length ? `${data.cycle_length} days` : 'Not set',
          period_length: data.period_length ? `${data.period_length} days` : 'Not set',
        });
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
  
 

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="rgb(218,79,122)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

   {loading
    ?
      (<View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="rgb(218,79,122)" />
      </View>):
  
       (<ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["rgb(218,79,122)"]}
            tintColor="rgb(218,79,122)"  // iOS
          />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.imageWrapper}>
            <Image
              source={require('../assets/Avatar.jpeg')}
              style={styles.profileImage}
            />
            <View style={styles.editBadge}>
              <Icon name="photo-camera" size={16} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.userName}>
            {profileData.name}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          <ProfileField label="Age" value={profileData.age} />
          <ProfileField label="Weight" value={profileData.weight} />
          <ProfileField label="Location" value={profileData.location} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Pregnancy Details</Text>
          <ProfileField label="Due Date" value={profileData.due_date} />
          <ProfileField label="Last Menstrual Period" value={profileData.lmp} />
          <ProfileField label="Cycle Length" value={profileData.cycle_length} />
          <ProfileField label="Period Length" value={profileData.period_length} />
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.actionButtonText}>Edit Information</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BabyNest v1.0.0</Text>
        </View>
      </ScrollView>)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
 centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContent: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgb(218,79,122)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff0f6',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgb(218,79,122)',
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 15,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eeeeee',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgb(218,79,122)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: 'rgb(218,79,122)',
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 30,
    backgroundColor: 'rgb(218,79,122)',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#bbbbbb',
  },
});