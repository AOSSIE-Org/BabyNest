import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  FlatList,
  Modal,
  ScrollView,
  PermissionsAndroid,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {countries} from '../data/countries';
import {BASE_URL} from '@env';
import {Calendar} from 'react-native-calendars';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function EditProfileScreen() {
  const navigation = useNavigation();

  const [country, setCountry] = useState('');
  const [lmpDate, setLmpDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(65);
  const [errors, setErrors] = useState({});
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const filteredCountries = countries.filter(c =>
    c.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_profile`);
      if (response.ok) {
        const data = await response.json();
        setCountry(data.location || '');
        setLmpDate(data.lmp || '');
        setCycleLength(data.cycle_length || 28);
        setPeriodLength(data.period_length || 5);
        setAge(data.age || 30);
        setWeight(data.weight || 65);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      if (auth === 'granted') return true;
      return false;
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need access to your location to detect your country.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const detectLocation = async () => {
    setLoadingLocation(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setErrors(prev => ({...prev, country: 'Location permission denied'}));
      setLoadingLocation(false);
      return;
    }

    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'BabyNest/1.0',
              },
            },
          );
          const data = await response.json();
          if (data && data.address && data.address.country) {
            setCountry(data.address.country);
            setErrors(prev => ({...prev, country: ''}));
          } else {
            setErrors(prev => ({...prev, country: 'Could not detect country'}));
          }
        } catch (error) {
          console.error(error);
          setErrors(prev => ({...prev, country: 'Error fetching country'}));
        } finally {
          setLoadingLocation(false);
        }
      },
      error => {
        console.log(error.code, error.message);
        setErrors(prev => ({...prev, country: 'Error getting location'}));
        setLoadingLocation(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleSave = async () => {
    let newErrors = {};

    if (!country.trim()) newErrors.country = 'Country is required';
    if (!lmpDate) newErrors.lmpDate = 'Last menstrual period date is required';
    if (
      !cycleLength ||
      isNaN(cycleLength) ||
      Number(cycleLength) < 20 ||
      Number(cycleLength) > 40
    ) {
      newErrors.cycleLength = 'Enter a valid cycle length (20-40 days)';
    }
    if (
      !periodLength ||
      isNaN(periodLength) ||
      Number(periodLength) < 1 ||
      Number(periodLength) > 10
    ) {
      newErrors.periodLength = 'Enter a valid period length (1-10 days)';
    }
    if (!age || isNaN(age) || Number(age) < 12 || Number(age) > 60) {
      newErrors.age = 'Enter a valid age (12-60 years)';
    }
    if (
      !weight ||
      isNaN(weight) ||
      Number(weight) < 30 ||
      Number(weight) > 200
    ) {
      newErrors.weight = 'Enter a valid weight (30-200 kg)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/update_profile`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          location: country,
          lmp: lmpDate,
          cycleLength: cycleLength,
          periodLength: periodLength,
          age: Number(age),
          weight: Number(weight),
        }),
      });

      const data = await res.json();

      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCountry = selectedCountry => {
    setCountry(selectedCountry);
    setShowCountryModal(false);
    setErrors(prev => ({...prev, country: ''}));
  };

  const handleDayPress = day => {
    setLmpDate(day.dateString);
    setShowCalendar(false);
    setErrors(prev => ({...prev, lmpDate: ''}));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="rgb(218,79,122)" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="rgb(218,79,122)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* Country */}
          <Text style={styles.label}>Select Country</Text>
          <TouchableOpacity
            style={[styles.input, errors.country ? styles.errorBorder : null]}
            onPress={() => setShowCountryModal(true)}>
            <View style={styles.inputContainer}>
              <Text style={country ? styles.inputText : styles.placeholderText}>
                {country || 'Select Your Country'}
              </Text>
              {loadingLocation && !country ? (
                <ActivityIndicator size="small" color="#ff4081" />
              ) : (
                <Text style={styles.dropdownArrow}>▼</Text>
              )}
            </View>
          </TouchableOpacity>
          {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}

          <TouchableOpacity
            onPress={detectLocation}
            style={styles.detectButton}>
            <Icon name="my-location" size={16} color="rgb(218,79,122)" />
            <Text style={styles.detectButtonText}>Detect My Location</Text>
          </TouchableOpacity>

          {/* LMP Date */}
          <Text style={styles.label}>Last Menstrual Period (LMP)</Text>
          <TouchableOpacity
            style={[styles.input, errors.lmpDate ? styles.errorBorder : null]}
            onPress={() => setShowCalendar(true)}>
            <Text style={lmpDate ? styles.inputText : styles.placeholderText}>
              {lmpDate || 'Select Date'}
            </Text>
            <Icon name="calendar-today" size={20} color="rgb(218,79,122)" />
          </TouchableOpacity>
          {errors.lmpDate && <Text style={styles.errorText}>{errors.lmpDate}</Text>}

          {/* Cycle Length */}
          <Text style={styles.label}>Cycle Length (Days)</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setCycleLength(prev => Math.max(20, prev - 1))}>
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.stepperInput, errors.cycleLength ? styles.errorBorder : null]}
              value={String(cycleLength)}
              onChangeText={text => setCycleLength(text)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setCycleLength(prev => Math.min(40, Number(prev) + 1))}>
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {errors.cycleLength && <Text style={styles.errorText}>{errors.cycleLength}</Text>}

          {/* Period Length */}
          <Text style={styles.label}>Period Length (Days)</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setPeriodLength(prev => Math.max(1, prev - 1))}>
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.stepperInput, errors.periodLength ? styles.errorBorder : null]}
              value={String(periodLength)}
              onChangeText={text => setPeriodLength(text)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setPeriodLength(prev => Math.min(10, Number(prev) + 1))}>
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {errors.periodLength && <Text style={styles.errorText}>{errors.periodLength}</Text>}

          {/* Age */}
          <Text style={styles.label}>Age (Years)</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setAge(prev => Math.max(12, prev - 1))}>
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.stepperInput, errors.age ? styles.errorBorder : null]}
              value={String(age)}
              onChangeText={text => setAge(text)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setAge(prev => Math.min(60, Number(prev) + 1))}>
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

          {/* Weight */}
          <Text style={styles.label}>Weight (kg)</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setWeight(prev => Math.max(30, prev - 1))}>
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.stepperInput, errors.weight ? styles.errorBorder : null]}
              value={String(weight)}
              onChangeText={text => setWeight(text)}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setWeight(prev => Math.min(200, Number(prev) + 1))}>
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleSelectCountry(item)}>
                  <Text style={styles.countryText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select LMP Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDayPress}
              maxDate={new Date().toISOString().split('T')[0]}
              markedDates={{
                [lmpDate]: {selected: true, selectedColor: 'rgb(218,79,122)'},
              }}
              theme={{
                selectedDayBackgroundColor: 'rgb(218,79,122)',
                todayTextColor: 'rgb(218,79,122)',
                arrowColor: 'rgb(218,79,122)',
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#999999',
  },
  errorBorder: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  detectButtonText: {
    color: 'rgb(218,79,122)',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgb(218,79,122)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepperInput: {
    flex: 1,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: 'rgb(218,79,122)',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  calendarModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    fontSize: 16,
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  countryText: {
    fontSize: 16,
    color: '#000000',
  },
});
