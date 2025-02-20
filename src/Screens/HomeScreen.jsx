//COLOR PALLETE
//F4D1FF FA9EBC 0B1957 5784E6

import React, { useState,useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,Animated, Modal, ScrollView,Dimensions,Image  } from "react-native";
import { Card, Button, TextInput,Divider } from "react-native-paper";
import {LinearGradient} from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/Ionicons";
import CustomHeader from "../Components/CustomHeader";
import Svg, { Path, Circle } from "react-native-svg";

export default function HomeScreen({navigation}) {

  const [appointments, setAppointments] = useState([
    { title: "Initial Prenatal Visit - Week 6-8", completed: false },
    { title: "First Trimester Screening - Week 10-13", completed: false },
    { title: "Anatomy Scan - Week 18-22", completed: false },
    { title: "Glucose Tolerance Test - Week 24-28", completed: false },
    { title: "Routine Check-ups", completed: false },
    { title: "Group B Strep Test - Week 35-37", completed: false },
  ]);

     // Dummy data for Due Appointments 
  const dueAppointments = [
    "Next Ultrasound - Week 20",
    "Upcoming Glucose Test - Week 26",
    "Regular Check-up - Week 30",
  ];

  const [newAppointment, setNewAppointment] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const handleSave = () => {
    if (!newAppointment.trim()) return;
    setAppointments([...appointments, { title: newAppointment, completed: false }]);
    setNewAppointment("");
    setModalVisible(false);
  };

  const openDrawer = () => {
    navigation.openDrawer();
  };

  // Progress value between 0 and 1 (33 weeks out of 40 weeks)
  const progress = 33 / 40
  const circleLength = 2 * Math.PI * 90 // radius = 90
  const progressLength = circleLength * progress

  const { width } = Dimensions.get("window")

  return (
    <>
    <View style={styles.container}>
        <View style={styles.gradientContainer}> 
        <LinearGradient colors={["rgb(218,79,122)", "#fff"]} style={styles.gradient}> 
          {/* <Svg height="100%" width="100%" style={styles.curve} viewBox={`0 0 ${width} 100`}>
            <Path d={`M0 0 L${width} 0 L${width} 60 Q${width / 2} 100 0 60 Z`} fill="#FF758C" />
          </Svg> */}
         </LinearGradient>
       </View>
       {/* <CustomHeader /> */}
       <View style={styles.header}>
               <TouchableOpacity
                 onPress={openDrawer}
                 style={styles.menuButton}
               >
                 <Icon name="menu" size={24} color="#fff" />
               </TouchableOpacity>
       
               <TouchableOpacity
                 onPress={() => navigation.navigate('Settings')}
                 style={styles.profileButton}
               >
                 <Image
                  source={require("../assets/Avatar.jpeg")}  style={styles.profileImage}
                 />
               </TouchableOpacity>
             </View>
       <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>  
           <Svg height={200} width={200} style={styles.progressCircle}>
            {/* Background Circle */}
            <Circle cx="100" cy="100" r="90" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="10" fill="none" /> 
            {/* Progress Circle */}
             <Circle
              cx="100"
              cy="100"
              r="90"
              stroke="#FFFFFF"
              strokeWidth="10"
              strokeDasharray={`${progressLength} ${circleLength}`}
              strokeLinecap="round"
              fill="none"
              transform="rotate(-90 100 100)"
            />
          </Svg>  
          <Text style={styles.title}>16th Week of Pregnancy</Text>
          {/* Baby Image */}
           <View style={styles.babyImageContainer}>
            <Image source={require("../assets/Baby.jpeg")} style={styles.babyImage} />
          </View>
        </View>

      {/* SOS Button */}
      <View style={styles.sosContainer}>
      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate("SOSAlert")}>
        <Icon name="call" size={22} color="white" />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
      </View> 
        <View style={styles.weekContainer}>
           <WeekNumber number="31" />
           <WeekNumber number="32" />
           <WeekNumber number="33" active />
           <WeekNumber number="34" />
         </View>

        {/* Fact Card */}
        <LinearGradient colors={["rgb(246,199,210)", "rgb(249, 234, 234)"]} style={styles.factCard}>
          <Card.Content>
            <Text style={styles.factText}>
              During pregnancy, the heart grows in size to pump up to 50% more blood for both mother and baby.
            </Text>
          </Card.Content>
        </LinearGradient>

        {/* Appointments */}
        <LinearGradient colors={["#fce4ec", "#fce4ec"]} style={styles.container1}>
          <Card.Title title="Appointments" />
          <Card.Content>
            <FlatList
              data={appointments}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <>
                <View style={styles.listItem}>
                  <Text style={styles.noteText}>{item.title}</Text> 
                </View>
                { <Divider style={ styles.divider} />}
                </>
              )}
            />
            <Button mode="contained" onPress={() => setModalVisible(true)} style={styles.addButton}>
              + Add Appointment
            </Button>
          </Card.Content>
      </LinearGradient>


      {/* Horizontol Scroll for Due Tasks */}
      <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming / Due Tasks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {dueAppointments.map((item, index) => (
                <LinearGradient colors={["rgb(35,79,147)", "rgb(90,110,203)"]} style={styles.dueItem}>
                <View key={index}>
                  <Text style={styles.dueText}>{item}</Text>
                </View>
                </LinearGradient>
              ))}
            </ScrollView>
          </View>
          </ScrollView>

      {/* Add Appointment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput label="Enter appointment" value={newAppointment} onChangeText={setNewAppointment} />
            <Button mode="contained" onPress={handleSave} style={styles.modalButton}>Save</Button>
            <Button mode="text" onPress={() => setModalVisible(false)}>Cancel</Button>
          </View>
        </View>
      </Modal>

        <TouchableOpacity style={styles.floatingButton} onPress={navigation.navigate('Chat')}>
          <MaterialIcons name="smart-toy" size={30} color="#fff" />
        </TouchableOpacity>
        </View>
        </>
  );
}

const WeekNumber = ({ number, active = false }) => (
  <View style={[styles.weekNumber, active && styles.weekNumberActive]}>
    <Text style={[styles.weekNumberText, active && styles.weekNumberTextActive]}>{number}</Text>
  </View>
)

const styles = StyleSheet.create({
  //   week horiztonol bar at top
    weekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  dayBox: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  selectedDay: {
    backgroundColor: "rgb(218,79,122)",
  },
  dayText: {
    color: "#333",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  container: { 
    flex: 1, 
    padding:20, 
    backgroundColor: "#fff" 
  },
  container1: { 
    flex: 1, 
    padding: 10, 
    marginBottom: 20 ,
    borderRadius: 20
  },
  title: { fontSize: 22, 
    fontWeight: "bold", 
    color: "#333",
    marginRight: 100,
    marginBottom: 30 
  },
  factCard: { 
    marginBottom: 20, 
    borderRadius: 20 ,
    padding: 10
  },
  factText: { 
    fontSize: 16, 
    textAlign: "center", 
    color: "#333" 
  },
  section: { 
    marginBottom: 20, 
    borderRadius: 10 
  },
  listItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  noteText: { 
    marginLeft: 10, 
    color:"#333"
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  modalContent: { 
    backgroundColor: "#fff", 
    padding: 20, 
    borderRadius: 10, 
    width: "80%" 
  },
  modalButton: { 
    marginTop: 10 
  },
  addButton: { 
    backgroundColor: "rgb(218,79,122)",
    marginBottom: 10 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgba(0, 0, 0, 0.8)",
    marginBottom: 10,
  },
    floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ff4081",
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },

     // Due Appointments
  horizontalScroll: {
    flexDirection: "row",
    paddingBottom: 10,
  },
  dueItem: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#5784E6",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    height: 120,
    width: 150,
  },
  dueText: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
    color: "#fff",
  },

  //floating chatbot button
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#0B1957",
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },

  //sos feature
sosContainer:{ 
  flex: 1, 
  justifyContent: "center", 
  alignItems: "center", 
  backgroundColor: "rgb(218,79,122)", 
  marginBottom: 10 
},
sosButton: { 
  backgroundColor: "rgb(218,79,122)", 
  padding: 8, 
  borderRadius: 40, 
  flexDirection: "row", 
  alignItems: "center",
  zIndex:999,
  marginLeft:270,
  marginTop:-450 
},
sosText: { 
  color: "white", 
  fontSize: 12, 
  fontWeight: "bold", 
  marginLeft: 5 
},

//line between appointments
divider: {
  height: 1,
  backgroundColor: 'rgb(202, 202, 202)',
  marginHorizontal: 5,
},

//upper portion of home screen
  gradientContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
  },
  gradient: {
    flex: 1,
  },
  curve: {
    position: "absolute",
    bottom: -1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  progressContainer: {
    width: 600,
    height: 200,
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircle: {
    marginTop: 63,
    position: "absolute",
  },
  babyImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  babyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
    weekContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 10,
  },
  weekNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 75, 110, 0.1)",
  },
  weekNumberActive: {
    backgroundColor: "#FF4B6E",
  },
  weekNumberText: {
    color: "#FF4B6E",
    fontSize: 16,
    fontWeight: "600",
  },
  weekNumberTextActive: {
    color: "#FFFFFF",
  },
  weekLabel: {
    color: "#FF4B6E",
    fontSize: 12,
    marginBottom: 20,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 44 : 0, 
  },

    profileImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
});
