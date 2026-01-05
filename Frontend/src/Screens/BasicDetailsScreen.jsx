import React, { useState, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { countries } from '../data/countries';
import { BASE_URL } from '@env';
import { Calendar } from 'react-native-calendars';
export default function BasicDetailsScreen() {
  const navigation = useNavigation();

  const [country, setCountry] = useState('');
  const [lmpDate, setLmpDate] = useState('');
  const [cycleLength, setCycleLength] = useState('');
  const [periodLength, setPeriodLength] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState({});
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredCountries = useMemo(() => {
    return countries.filter(country =>
      country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery])

  const handleContinue = async () => {
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
    try {
      setIsLoading(true);
    const res = await fetch(`${BASE_URL}/set_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: country,
        lmp: lmpDate,
        cycleLength: Number(cycleLength),
        periodLength: Number(periodLength),
        age: Number(age),
        weight: Number(weight),
      }),
    });

    const data = await res.json();

    if (data.error) {
      setErrors({ form: data.error });
    } else {
      setErrors({});
      navigation.replace('DueDate', { dueDate: data.dueDate });
    }
  } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCountry = selectedCountry => {
    setCountry(selectedCountry);
    setShowCountryModal(false);
    setErrors(prev => ({ ...prev, country: '' }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Enter Your Details</Text>

          {/* Country */}
          <Text style={styles.title1}>Select Country</Text>
          <TouchableOpacity
            style={[styles.input, errors.country ? styles.errorBorder : null]}
            onPress={() => setShowCountryModal(true)}>
            <View style={styles.inputContainer}>
              <Text style={country ? styles.inputText : styles.placeholderText}>
                {country || 'Select Your Country'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </View>
          </TouchableOpacity>
          {errors.country ? (
            <Text style={styles.errorText}>{errors.country}</Text>
          ) : null}

          <Modal
            visible={showCountryModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCountryModal(false)}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select a Country</Text>


                <TextInput
                  style={styles.searchInput}
                  placeholder="Search country..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                <FlatList
                  data={filteredCountries}
                  keyExtractor={item => item}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.countryItem}
                      onPress={() => handleSelectCountry(item)}>
                      <Text style={styles.countryText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowCountryModal(false);
                    setSearchQuery('');
                  }}>
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

          {/* Inputs */}
          <Text style={styles.title1}>Last Menstrual Period</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              current={lmpDate}
              maxDate={new Date().toISOString().split('T')[0]}
              onDayPress={day => setLmpDate(day.dateString)}
              markedDates={{
                [lmpDate]: { selected: true, selectedColor: '#ff4081' },
              }}
              theme={{
                todayTextColor: '#ff4081',
                arrowColor: '#ff4081',
              }}
            />
          </View>
          {errors.lmpDate ? (
            <Text style={styles.errorText}>{errors.lmpDate}</Text>
          ) : null}

          <Text style={styles.title1}>Cycle Length (days)</Text>
          <TextInput
            placeholder="28"
            keyboardType="numeric"
            value={cycleLength}
            onChangeText={setCycleLength}
            style={[styles.input, errors.cycleLength ? styles.errorBorder : null]}
          />
          {errors.cycleLength ? (
            <Text style={styles.errorText}>{errors.cycleLength}</Text>
          ) : null}

          <Text style={styles.title1}>Period Length (days)</Text>
          <TextInput
            placeholder="5"
            keyboardType="numeric"
            value={periodLength}
            onChangeText={setPeriodLength}
            style={[
              styles.input,
              errors.periodLength ? styles.errorBorder : null,
            ]}
          />
          {errors.periodLength ? (
            <Text style={styles.errorText}>{errors.periodLength}</Text>
          ) : null}

          <Text style={styles.title1}>Age</Text>
          <TextInput
            placeholder="30"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            style={[styles.input, errors.age ? styles.errorBorder : null]}
          />
          {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}

          <Text style={styles.title1}>Weight (kg)</Text>
          <TextInput
            placeholder="65"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            style={[styles.input, errors.weight ? styles.errorBorder : null]}
          />
          {errors.weight ? <Text style={styles.errorText}>{errors.weight}</Text> : null}

          {errors.form ? (
            <Text style={styles.errorText}>{errors.form}</Text>
          ) : null}

          <Text style={styles.disclaimer}>
            We are collecting this information solely to provide accurate
            AI-generated insights based on your pregnancy duration.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleContinue}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    marginTop: Platform.OS === 'android' ? 30 : 0,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  title1: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#999',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  countryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ff4081',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorBorder: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff4081',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
});
