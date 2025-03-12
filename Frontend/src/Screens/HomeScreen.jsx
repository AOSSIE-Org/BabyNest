//COLOR PALLETE
//F4D1FF FA9EBC 0B1957 5784E6

import React, { useState,useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,Animated, Modal, ScrollView,Dimensions,Image, Platform, SafeAreaView } from "react-native";
import { Card, Button, TextInput,Divider } from "react-native-paper";
import {LinearGradient} from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/Ionicons";
import CustomHeader from "../Components/CustomHeader";
import Svg, { Path, Circle } from "react-native-svg";

export default function HomeScreen({navigation}) {

  const [appointments, setAppointments] = useState([
    { id:1, title: "Initial Prenatal Visit - Week 6-8", completed: false },
    { id:2, title: "First Trimester Screening - Week 10-13", completed: false },
    { id:3, title: "Anatomy Scan - Week 18-22", completed: false },
    { id:4, title: "Glucose Tolerance Test - Week 24-28", completed: false },
    { id:5, title: "Routine Check-ups", completed: false },
    { id:6, title: "Group B Strep Test - Week 35-37", completed: false },
  ]);

     // Dummy data for Due Appointments 
  const dueAppointments = [
    "Next Ultrasound - Week 20",
    "Upcoming Glucose Test - Week 26",
    "Regular Check-up - Week 30",
  ];

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
    <SafeAreaView style={styles.container}>
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
       <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}showsVerticalScrollIndicator={false}>
        {/* <View style={styles.progressContainer}>  */}
          {/* Fixed upper section to match design */}
        <View style={styles.upperSection}>
          <Text style={styles.title}>16th Week of Pregnancy</Text>

          <View style={styles.progressCircleContainer}>
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
          
          {/* Baby Image */}
           <View style={styles.babyImageContainer}>
            <Image source={require("../assets/Baby.jpeg")} style={styles.babyImage} />
          </View>
        </View>

      {/* SOS Button */}
      {/* <View style={styles.sosContainer}>  */}
      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate("SOSAlert")}>
        <Icon name="call" size={22} color="white" />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
      {/* </View>  */}
        <View style={styles.weekContainer}>
           <WeekNumber number="31" />
           <WeekNumber number="32" />
           <WeekNumber number="33" active />
           <WeekNumber number="34" />
         </View>
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
        <LinearGradient colors={["#fce4ec", "#fce4ec"]} style={styles.appointmentCard}>
          <Card.Title title="Appointments" titleStyle={styles.cardTitle}/>
          <Card.Content>

            {appointments.map((item) => (
              <View key={item.id}>
              <View style={styles.listItem}>
                <Text style={styles.noteText}>{item.title}</Text> 
              </View>
              { <Divider style={ styles.divider} />}
              </View>
            ))}
            <Button mode="contained" onPress={() => navigation.navigate("Calendar")} style={styles.addButton}>
              See More

            </Button>
          </Card.Content>
      </LinearGradient>


      {/* Horizontol Scroll for Due Tasks */}
      <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming / Due Tasks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {dueAppointments.map((item, index) => (
                <LinearGradient  key={index} colors={["rgb(35,79,147)", "rgb(90,110,203)"]} style={styles.dueItem}>
                <View>
                  <Text style={styles.dueText}>{item}</Text>
                </View>
                </LinearGradient>
              ))}
            </ScrollView>
          </View>
          </ScrollView>

        <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('Chat')}>

          <MaterialIcons name="smart-toy" size={30} color="#fff" />
        </TouchableOpacity>
        </SafeAreaView>
        </>
  );
}

const WeekNumber = ({ number, active = false }) => (
  <View style={[styles.weekNumber, active && styles.weekNumberActive]}>
    <Text style={[styles.weekNumberText, active && styles.weekNumberTextActive]}>{number}</Text>
  </View>
)

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({

  // Fixed upper section styles to match the design
  upperSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 10,
    position: "relative",
  },
  //   week horiztonol bar at top
    weekContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop:0,
    marginBottom: 10,
    gap: 12,
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
    backgroundColor: "#fff" 
  },
  appointmentCard: { 
    borderRadius: 20,
    marginBottom: 20,
    width: "100%"
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#333",
    marginRight: 5,
    marginBottom: 5, 
  },
  factCard: { 
    marginBottom: 20, 
    borderRadius: 20 ,
    padding: 10,
    width: "100%"
  },
  factText: { 
    fontSize: 16, 
    textAlign: "center", 
    color: "#333" 
  },
  section: { 
    marginBottom: 20, 
    borderRadius: 10,
    width: "100%"
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
    width: width *0.8, 
  },
  modalInput: {
    marginBottom: 10,
  },
  modalButton: { 
    marginTop: 15,
    marginBottom: 10,
  },
  addButton: { 
    backgroundColor: "rgb(218,79,122)",

    marginTop: -10,
    marginBottom: 10 

  },
  sectionTitle: {
    fontSize: 18,
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
    zIndex: 999,
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
    height: 100,
    width: width * 0.4,
    minWidth: 150,
  },
  dueText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    width: "100%",
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
  position: "absolute",
  top: 120, // Adjusted position to match the image better
  right: 15,
  backgroundColor: "rgb(218,79,122)", 
  paddingHorizontal: 10, 
  paddingVertical: 6,
  borderRadius: 20, 
  flexDirection: "row", 
  alignItems: "center",
  zIndex:100,
},
sosText: { 
  color: "white", 
  fontSize: 14, 
  fontWeight: "bold", 
  marginLeft: 5 
},

//line between appointments
divider: {
  height: 1,
  backgroundColor: 'rgb(202, 202, 202)',
  marginVertical: 5,
},

//upper portion of home screen
  gradientContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "63%",
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
    padding: 15,
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
    position: "absolute",
  },
  babyImageContainer: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -75 }],
  },
  progressCircleContainer: {
    position: "relative",
    width: 200,
    height: 180, // Reduced height to better match the image
    alignItems: "center",
    justifyContent: "center",
  },
  babyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
    weekContainer: {
    flexDirection: "row", 
    justifyContent: "center",
    gap:12,
    marginBottom: 10,
    marginTop: 10,
  },
  weekNumber: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 75, 110, 0.1)",
  },
  weekNumberActive: {
    backgroundColor: "#FF4B6E",
  },
  weekNumberText: {
    color: "#FF4B6E",
    fontSize: 14,
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
    marginTop: Platform.OS === 'ios' ? 0: 0,
    paddingHorizontal: 20, 
    zIndex: 10,
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
});
