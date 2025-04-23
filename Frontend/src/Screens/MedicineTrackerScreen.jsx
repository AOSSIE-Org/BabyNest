import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from "react-native";
import { Card, Button, TextInput, Divider, FAB, Checkbox, Menu } from "react-native-paper";
import { LinearGradient } from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from '../theme/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function MedicineTrackerScreen({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMedicineIndex, setSelectedMedicineIndex] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  
  // New medication form state
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    dosage: "",
    frequency: "daily",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    time: new Date(),
    notes: "",
  });
  
  // For simple name editing
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [editingMedicineName, setEditingMedicineName] = useState("");

  // Mock medication history data
  const [medicationHistory, setMedicationHistory] = useState([]);

  // Fetch medications from storage/API on component mount
  useEffect(() => {
    const loadMedications = async () => {
      setLoading(true);
      try {  
        const mockMedications = [
          {                        // dummy data
            id: '1',
            name: 'Prenatal Vitamins',
            dosage: '1 tablet',
            frequency: 'daily',
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            time: new Date(new Date().setHours(8, 0, 0, 0)),
            notes: 'Take with food',
            taken: false,
          }
        ];

        // Mock history data
        const mockHistory = [
          {
            id: '1',
            medicineName: 'Prenatal Vitamins',
            status: 'taken',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            time: '08:00 AM'
          },
          {
            id: '2',
            medicineName: 'Iron Supplement',
            status: 'taken',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            time: '01:30 PM'
          },
          {
            id: '3',
            medicineName: 'Calcium',
            status: 'missed',
            date: new Date(Date.now() - 48 * 60 * 60 * 1000),
            time: '07:00 PM'
          }
        ];

        setMedications(mockMedications);
        setMedicationHistory(mockHistory);
      } catch (error) {
        console.error('Error loading medications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMedications();
  }, []);

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      Alert.alert('Missing Information', 'Please enter medicine name and dosage');
      return;
    }

    const newMed = {
      id: Date.now().toString(),
      ...newMedicine,
      taken: false
    };

    setMedications([...medications, newMed]);

    // Reset form
    setNewMedicine({
      name: "",
      dosage: "",
      frequency: "daily",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      time: new Date(),
      notes: "",
    });

    setModalVisible(false);
  };

  const handleEditMedicine = (index) => {
    setSelectedMedicineIndex(index);
    setEditingMedicineName(medications[index].name);
    setEditNameModalVisible(true);
  };

  const handleUpdateMedicineName = () => {
    if (selectedMedicineIndex !== null && editingMedicineName.trim() !== "") {
      const updatedMedications = [...medications];
      updatedMedications[selectedMedicineIndex] = {
        ...updatedMedications[selectedMedicineIndex],
        name: editingMedicineName
      };
      setMedications(updatedMedications);
      setEditNameModalVisible(false);
      setSelectedMedicineIndex(null);
    }
  };

  const handleDeleteMedicine = (index) => {
    // Directly remove the medicine without confirmation
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    setMedications(updatedMedications);
  };

  const handleToggleTaken = (index) => {
    const updatedMedications = [...medications];
    updatedMedications[index].taken = !updatedMedications[index].taken;
    setMedications(updatedMedications);

    // Add to history
    if (updatedMedications[index].taken) {
      const newHistoryItem = {
        id: Date.now().toString(),
        medicineName: updatedMedications[index].name,
        status: 'taken',
        date: new Date(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMedicationHistory([newHistoryItem, ...medicationHistory]);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderDatePicker = () => {
    if (showDatePicker) {
      return (
        <DateTimePicker
          value={selectedMedicineIndex !== null ? newMedicine.startDate : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setNewMedicine({...newMedicine, startDate: selectedDate});
            }
          }}
        />
      );
    }
    return null;
  };

  const renderTimePicker = () => {
    if (showTimePicker) {
      return (
        <DateTimePicker
          value={selectedMedicineIndex !== null ? newMedicine.time : new Date()}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setNewMedicine({...newMedicine, time: selectedTime});
            }
          }}
        />
      );
    }
    return null;
  };

  const renderMedicineModal = () => {
    return (
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <LinearGradient
          colors={[theme.factcardprimary, theme.factcardsecondary]}
          style={styles.modalContent}
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {selectedMedicineIndex !== null ? 'Update Medication' : 'Add New Medication'}
          </Text>

          <TextInput
            label="Medicine Name"
            value={newMedicine.name}
            onChangeText={(text) => setNewMedicine({...newMedicine, name: text})}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Dosage"
            value={newMedicine.dosage}
            onChangeText={(text) => setNewMedicine({...newMedicine, dosage: text})}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.rowContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Start Date:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{formatDate(newMedicine.startDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Time:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>{formatTime(newMedicine.time)}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            label="Frequency"
            value={newMedicine.frequency}
            onChangeText={(text) => setNewMedicine({...newMedicine, frequency: text})}
            style={styles.input}
            mode="outlined"
            placeholder="daily, twice daily, etc."
          />

          <TextInput
            label="Notes"
            value={newMedicine.notes}
            onChangeText={(text) => setNewMedicine({...newMedicine, notes: text})}
            style={styles.input}
            mode="outlined"
            multiline
          />

          <View style={styles.modalButtonContainer}>
            <Button
              mode="contained"
              onPress={() => setModalVisible(false)}
              style={[styles.modalButton, { backgroundColor: '#878787' }]}
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              onPress={handleAddMedicine}
              style={[styles.modalButton, { backgroundColor: theme.button }]}
            >
              Add
            </Button>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderEditNameModal = () => {
    return (
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <LinearGradient
          colors={[theme.factcardprimary, theme.factcardsecondary]}
          style={[styles.modalContent, { width: width * 0.75, padding: 16 }]}
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Edit Medicine Name
          </Text>

          <TextInput
            label="Medicine Name"
            value={editingMedicineName}
            onChangeText={setEditingMedicineName}
            style={styles.input}
            mode="outlined"
            autoFocus
          />

          <View style={styles.modalButtonContainer}>
            <Button
              mode="contained"
              onPress={() => setEditNameModalVisible(false)}
              style={[styles.modalButton, { backgroundColor: '#878787' }]}
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              onPress={handleUpdateMedicineName}
              style={[styles.modalButton, { backgroundColor: theme.button }]}
            >
              Update
            </Button>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderHistoryModal = () => {
    return (
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <LinearGradient
          colors={[theme.factcardprimary, theme.factcardsecondary]}
          style={styles.modalContent}
        >
          <View style={styles.historyModalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text, flex: 1 }]}>Medication History</Text>
            <TouchableOpacity
              onPress={() => setHistoryModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.historyList}>
            {medicationHistory.map((item, index) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyItemContent}>
                  <Text style={styles.historyItemTitle}>{item.medicineName}</Text>
                  <Text style={styles.historyItemDate}>
                    {formatDate(item.date)} at {item.time}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'taken' ? '#4CAF50' : '#F44336' }
                  ]}>
                    <Text style={styles.statusText}>
                      {item.status === 'taken' ? 'Taken' : 'Missed'}
                    </Text>
                  </View>
                </View>
                <Divider style={styles.historyDivider} />
              </View>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientContainer}>
        <LinearGradient colors={[theme.primary, theme.background]} style={styles.gradient} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.menuButton}
        >
          <Icon name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Medicine Tracker</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.profileButton}
        >
          <Image
            source={require("../assets/Avatar.jpeg")}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview */}
        <LinearGradient
          colors={[theme.factcardprimary, theme.factcardsecondary]}
          style={styles.overviewCard}
        >
          <View style={styles.overviewContent}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{medications.length}</Text>
              <Text style={styles.overviewLabel}>Total Medications</Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>
                {medications.filter(med => med.taken).length}
              </Text>
              <Text style={styles.overviewLabel}>Taken Today</Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>
                {medications.filter(med => !med.taken).length}
              </Text>
              <Text style={styles.overviewLabel}>Pending</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Today's Medications */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Medications</Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setHistoryModalVisible(true)}
          >
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FF4081" style={{ marginTop: 20 }} />
        ) : (
          <>
            {medications.length === 0 ? (
              <Text style={styles.emptyText}>No medications added yet</Text>
            ) : (
              medications.map((medicine, index) => (
                <LinearGradient
                  key={medicine.id}
                  colors={medicine.taken ?
                    ['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.1)'] :
                    [theme.cardBackgroundprimary, theme.cardBackgroundsecondary]
                  }
                  style={styles.medicineCard}
                >
                  <View style={styles.medicineCardContent}>
                    <View style={styles.medicineInfoContainer}>
                      <View style={styles.medicineNameContainer}>
                        <Checkbox
                          status={medicine.taken ? 'checked' : 'unchecked'}
                          onPress={() => handleToggleTaken(index)}
                          color={theme.button}
                        />
                        <Text style={[
                          styles.medicineName,
                          medicine.taken && styles.takenMedicineName
                        ]}>
                          {medicine.name}
                        </Text>
                      </View>

                      <View style={styles.medicineDetailsRow}>
                        <View style={styles.medicineDetail}>
                          <Icon name="flask-outline" size={16} color="#777" />
                          <Text style={styles.medicineDetailText}>{medicine.dosage}</Text>
                        </View>

                        <View style={styles.medicineDetail}>
                          <Icon name="time-outline" size={16} color="#777" />
                          <Text style={styles.medicineDetailText}>{formatTime(medicine.time)}</Text>
                        </View>

                        <View style={styles.medicineDetail}>
                          <Icon name="repeat-outline" size={16} color="#777" />
                          <Text style={styles.medicineDetailText}>{medicine.frequency}</Text>
                        </View>
                      </View>

                      {medicine.notes && (
                        <View style={styles.medicineNotesContainer}>
                          <Text style={styles.medicineNotes}>{medicine.notes}</Text>
                        </View>
                      )}
                    </View>

                    {/* Action buttons for edit and delete */}
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditMedicine(index)}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteMedicine(index)}
                      >
                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      {modalVisible && renderMedicineModal()}
      {editNameModalVisible && renderEditNameModal()}
      {historyModalVisible && renderHistoryModal()}
      {renderDatePicker()}
      {renderTimePicker()}

      {/* Add Medicine FAB */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.button }]}
        icon="plus"
        onPress={() => {
          setSelectedMedicineIndex(null);
          setNewMedicine({
            name: "",
            dosage: "",
            frequency: "daily",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            time: new Date(),
            notes: "",
          });
          setModalVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  gradientContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
  gradient: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 0 : 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff"
  },
  menuButton: {
    padding: 8,
  },
  profileButton: {
    padding: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 80,
  },

  // Overview Card
  overviewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
  },
  overviewDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "rgba(0, 0, 0, 0.8)",
  },
  historyButton: {
    padding: 8,
  },
  historyButtonText: {
    color: '#FF4081',
    fontWeight: '600',
  },

  // Medicine Cards
  medicineCard: {
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  medicineCardContent: {
    padding: 16,
    position: 'relative',
  },
  medicineInfoContainer: {
    flex: 1,
  },
  medicineNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#fff',
  },
  takenMedicineName: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  medicineDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  medicineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  medicineDetailText: {
    marginLeft: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  medicineNotesContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  medicineNotes: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },

  // Action Buttons (Edit and Delete)
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: 'rgba(244,67,54,0.2)',
  },
  deleteButtonText: {
    color: '#fff',
  },

  // Empty State
  emptyText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 16,
    marginTop: 40,
  },

  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },

  // Modal
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    padding: 20,
    borderRadius: 20,
    width: width * 0.85,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    width: 80,
    fontSize: 16,
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },

  // History Modal
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  closeButton: {
    padding: 4,
  },
  historyList: {
    maxHeight: height * 0.5,
    marginBottom: 20,
  },
  historyItem: {
    marginBottom: 10,
  },
  historyItemContent: {
    padding: 10,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyItemDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  historyDivider: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
