import React, {useState, useEffect} from 'react';
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
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import HeaderWithBack from '../Components/HeaderWithBack';
import {BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import {countries} from '../data/countries';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { getProfile, updateProfile } from '../storage/profile';


const ProfileField = ({label, value}) => {
  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
    </View>
  );
};

const InputField = ({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
}) => {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value === 'Not set' ? '' : value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A9A4AA"
        keyboardType={keyboardType}
      />
    </View>
  );
};

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState({
    name: 'Guest',
    due_date: 'Not set',
    location: 'Not set',
    LMP: 'Not set',
    cycleLength: 'Not set',
    periodLength: 'Not set',
    age: 'Not set',
    weight: 'Not set',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editProfileData, setEditProfileData] = useState(profileData);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const user_id = await AsyncStorage.getItem('user_id');

      const getProfileData = await getProfile(user_id);

      if (getProfileData.success) {
        const data = await getProfileData.data;
        setProfileData({
          name: data?.user_name || 'Guest',
          due_date: data.dueDate || 'Not set',
          location: data.user_location || 'Not set',
          LMP: data.lmp || 'Not set',
          cycleLength: data.cycleLength || 'Not set',
          periodLength: data.periodLength || 'Not set',
          age: data.age || 'Not set',
          weight: data.weight || 'Not set',
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

  // This will fetch the selectes image, which is stored locally.
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem('profile_image');

        if (savedImage) {
          setProfileImage(savedImage);
        }
      } catch (error) {
        console.log('Error loading profile image:', error);
      }
    };
    loadProfileImage();
  }, []);

  /*
  Handle Edit function.
  */
  const handleEditProfile = async data => {
    setLoading(true);
    try {
      if (
        !data.cycleLength ||
        isNaN(data.cycleLength) ||
        Number(data.cycleLength) < 20 ||
        Number(data.cycleLength) > 40
      ) {
        Toast.show({
          type: 'error',
          text1: 'Enter a valid cycle length (20-40 days)',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        return;
      }
      if (
        !data.periodLength ||
        isNaN(data.periodLength) ||
        Number(data.periodLength) < 1 ||
        Number(data.periodLength) > 10
      ) {
        Toast.show({
          type: 'error',
          text1: 'Enter a valid period length (1-10 days)',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        return;
      }
      if (
        !data.age ||
        isNaN(data.age) ||
        Number(data.age) < 12 ||
        Number(data.age) > 60
      ) {
        Toast.show({
          type: 'error',
          text1: 'Enter a valid age (12-60 years)',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        return;
      }
      if (
        !data.weight ||
        isNaN(data.weight) ||
        Number(data.weight) < 30 ||
        Number(data.weight) > 200
      ) {
        Toast.show({
          type: 'error',
          text1: 'Enter a valid weight (30-200 kg)',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        return;
      }
      const user_id = await AsyncStorage.getItem('user_id');
      const updated_data_res = await updateProfile(user_id, data);

      // Response handling part
      if (updated_data_res.success) {
        // Update complete profile state
        setProfileData({
          ...editProfileData,
        });
        Toast.show({
          type: 'success',
          text1: 'User profile updated successfully!',
          visibilityTime: 2000,
          position: 'bottom',
          topOffset: 50,
        });
        return;
      }

      // Error handling part.
      Toast.show({
        type: 'error',
        text1: updated_data_res.error.message || 'Enable to update data at backend side.',
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.log('Image picker error:', result.errorMessage);
        return;
      }

      const uri = result.assets?.[0]?.uri;

      if (uri) {
        setProfileImage(uri);

        await AsyncStorage.setItem('profile_image', uri);

        console.log('Image saved:', uri);
      }
    } catch (error) {
      console.log('Error selecting image:', error);
      Toast.show({
        type: 'error',
        text1: error,
        visibilityTime: 2000,
        position: 'bottom',
        topOffset: 50,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBack title="Profile" />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="rgb(218,79,122)" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{flexGrow: 1}}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['rgb(218,79,122)']}
              tintColor="rgb(218,79,122)"
            />
          }>
          <View style={styles.profileSection}>
            <View style={styles.imageWrapper}>
              <Image
                source={
                  profileImage
                    ? {uri: profileImage}
                    : require('../assets/Avatar.jpeg')
                }
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.editBadge}
                onPress={handleSelectImage}
                activeOpacity={0.7}>
                <Icon name="photo-camera" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{profileData.name}</Text>
            <Text style={styles.editText}>Edit your information below</Text>
          </View>

          <View style={styles.infoCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <View style={styles.iconCircle}>
                  <Icon name="person" size={22} color="rgb(218,79,122)" />
                </View>

                <View>
                  <Text style={styles.cardTitle}>Personal Details</Text>

                  <Text style={styles.cardSubtitle}>
                    Your pregnancy information
                  </Text>
                </View>
              </View>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon name="calendar-today" size={20} color="rgb(218,79,122)" />
              <ProfileField label="Due Date" value={profileData.due_date} />
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon name="location-on" size={24} color="rgb(218,79,122)" />
              <ProfileField label="Location" value={profileData.location} />
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon name="event" size={22} color="rgb(218,79,122)" />
              <ProfileField
                label="Last Menstrual Period"
                value={profileData.LMP}
              />
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon name="loop" size={22} color="rgb(218,79,122)" />
              <ProfileField
                label="Cycle Length"
                value={
                  profileData.cycleLength === 'Not set'
                    ? 'Not set'
                    : `${profileData.cycleLength} days`
                }
              />
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon name="event-available" size={22} color="rgb(218,79,122)" />
              <ProfileField
                label="Period Length"
                value={
                  profileData.periodLength === 'Not set'
                    ? 'Not set'
                    : `${profileData.periodLength} days`
                }
              />
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon name="cake" size={22} color="rgb(218,79,122)" />
              <ProfileField
                label="Age"
                value={
                  profileData.age === 'Not set'
                    ? 'Not set'
                    : `${profileData.age} years`
                }
              />
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
              <Icon name="fitness-center" size={22} color="rgb(218,79,122)" />
              <ProfileField
                label="Weight"
                value={
                  profileData.weight === 'Not set'
                    ? 'Not set'
                    : `${profileData.weight} kg`
                }
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setEditProfileData({...profileData});
              setEditModalVisible(true);
            }}>
            <Icon name="edit" size={20} color="#ffffff" />

            <Text style={styles.actionButtonText}>Edit Information</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>BabyNest v1.0.0</Text>
          </View>
        </ScrollView>
      )}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Personal Details</Text>

                <Text style={styles.modalSubtitle}>
                  Update your information
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.form}>
              {/* Name */}

              <InputField
                label="Name"
                value={editProfileData.name}
                placeholder="Enter your name"
                onChangeText={value =>
                  setEditProfileData(prev => ({
                    ...prev,
                    name: value,
                  }))
                }
              />

              <InputField
                label="Due Date"
                value={editProfileData.due_date}
                placeholder="YYYY-MM-DD"
                onChangeText={value =>
                  setEditProfileData(prev => ({
                    ...prev,
                    due_date: value,
                  }))
                }
              />
              <Text style={styles.inputLabel}>Location</Text>

              <View style={styles.pickerContainer}>
                <Picker
                  style={styles.Picker}
                  selectedValue={editProfileData.location}
                  onValueChange={value => {
                    setEditProfileData(prev => ({
                      ...prev,
                      location: value,
                    }));
                  }}>
                  <Picker.Item
                    label="Select location"
                    value={editProfileData.location}
                  />

                  {countries.map((country, index) => {
                    if (typeof country === 'string') {
                      return (
                        <Picker.Item
                          key={index}
                          label={country}
                          value={country}
                        />
                      );
                    }
                    return (
                      <Picker.Item
                        key={index}
                        label={country.name}
                        value={country.name}
                      />
                    );
                  })}
                </Picker>
              </View>
              <InputField
                label="Last Menstrual Period (LMP)"
                value={editProfileData.LMP}
                placeholder="YYYY-MM-DD"
                onChangeText={value =>
                  setEditProfileData(prev => ({
                    ...prev,
                    LMP: value,
                  }))
                }
              />
              <InputField
                label="Cycle Length (days)"
                value={editProfileData.cycleLength}
                placeholder={`e.g. ${editProfileData.cycleLength}`}
                keyboardType="numeric"
                onChangeText={value =>
                  setEditProfileData(prev => ({
                    ...prev,
                    cycleLength: value,
                  }))
                }
              />
              <InputField
                label="Period Length (days)"
                value={editProfileData.periodLength}
                placeholder={`e.g. ${editProfileData.periodLength}`}
                keyboardType="numeric"
                onChangeText={value =>
                  setEditProfileData(prev => ({
                    ...prev,
                    periodLength: value,
                  }))
                }
              />
              <InputField
                label="Age (years)"
                value={editProfileData.age}
                placeholder={`e.g. ${editProfileData.age}`}
                keyboardType="numeric"
                onChangeText={value =>
                  setEditProfileData(prev => ({
                    ...prev,
                    age: value,
                  }))
                }
              />
              <InputField
                label="Weight (kg)"
                value={editProfileData.weight}
                placeholder={`e.g. ${editProfileData.weight}`}
                keyboardType="decimal-pad"
                onChangeText={value =>
                  setEditProfileData(prev => ({
                    ...prev,
                    weight: value,
                  }))
                }
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditProfileData({...editProfileData});
                  setEditModalVisible(false);
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  handleEditProfile(editProfileData);
                  setEditModalVisible(false);
                }}>
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
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
    borderColor: '#FFF0F6',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgb(218,79,122)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111111',
    marginTop: 15,
  },

  editText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '400',
    marginTop: 3,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#F0E8EC',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: 'rgb(200,63,110)',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#99939A',
  },
  editButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  profileField: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#85808A',
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 17,
    color: '#17171B',
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 28,
    height: 56,
    backgroundColor: 'rgb(218,79,122)',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(218,79,122)',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 7,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  footer: {
    marginTop: 40,
    paddingBottom: 25,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#BBBBBB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF9FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '92%',
    padding: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF9FB',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E5E9',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'rgb(200,63,110)',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8E8991',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2ECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  inputWrapper: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5F5A62',
    marginBottom: 7,
  },
  input: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDE1',
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#18181D',
    ...Platform.select({
      android: {
        paddingVertical: 0,
      },
    }),
  },
  pickerContainer: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    padding: 8,
    borderColor: '#E4DDE1',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  Picker: {
    fontSize: 16,
    color: '#18181D',
    ...Platform.select({
      android: {
        paddingVertical: 0,
      },
    }),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE5E9',
  },
  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgb(218,79,122)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgb(218,79,122)',
  },
  saveButton: {
    flex: 1.5,
    height: 54,
    borderRadius: 15,
    backgroundColor: 'rgb(218,79,122)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
