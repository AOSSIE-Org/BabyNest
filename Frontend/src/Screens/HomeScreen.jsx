//COLOR PALLETE
//F4D1FF FA9EBC 0B1957 5784E6

import React, { useState,useRef,useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet,Animated, Modal, ScrollView,Dimensions,Image, Platform, SafeAreaView, ActivityIndicator } from "react-native";
import { Card, Button, TextInput,Divider } from "react-native-paper";
import {LinearGradient} from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/Ionicons";
import CustomHeader from "../Components/CustomHeader";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from '../theme/ThemeContext';
import { BASE_URL } from '@env'

export default function HomeScreen({navigation}) {
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [appointments, setAppointments] = useState([]);

     // Dummy data for Due Appointments 
  const dueAppointments = [
    "Next Ultrasound - Week 20",
    "Upcoming Glucose Test - Week 26",
    "Regular Check-up - Week 30",
  ];

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const getAppointments = async () => {
    try {
        const response = await fetch(`http://192.168.1.7:5000/get_appointments`); 
        const data = await response.json();
        console.log("Response:", data);
        setAppointments(data.splice(0, 2));
    } catch (error) {
        console.error('Error fetching appointments:', error);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
  console.log("hello");
  console.log("appointments",appointments);
    getAppointments();
}, []);



  // Progress value between 0 and 1 (33 weeks out of 40 weeks)
  const progress = 33 / 40
  const circleLength = 2 * Math.PI * 90 // radius = 90
  const progressLength = circleLength * progress

  const { width } = Dimensions.get("window")

  return (
    <>
    <SafeAreaView style={styles.container}>
        <View style={styles.gradientContainer}> 
          <LinearGradient colors={[theme.primary, theme.background]} style={styles.gradient}> 
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
          <Text style={[styles.title,{ color: theme.text}]}>16th Week of Pregnancy</Text>

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
          
          {/* <Text style={[styles.name,{ color: theme.text}]}>Ishaan Gupta</Text> */}
          {/* Baby Image */}
           <View style={styles.babyImageContainer}>
            <Image source={require("../assets/Baby.jpeg")} style={styles.babyImage} />
          </View>
        </View>

      {/* SOS Button */}
      <TouchableOpacity style={[styles.sosButton,{ backgroundColor: "#ffffff"}]} onPress={() => navigation.navigate("SOSAlert")}>
        <Icon name="call" size={22} style={[styles.sosIcon,{ color: "#FF0000"}]} />
        <Text style={[styles.sosText,{ color: '#FF0000'}]}>SOS</Text>
      </TouchableOpacity>
        <View style={styles.weekContainer}>
           <WeekNumber number="31" />
           <WeekNumber number="32" />
           <WeekNumber number="33" active />
           <WeekNumber number="34" />
         </View>
         </View>

        {/* Fact Card */}
        <LinearGradient colors={[theme.factcardprimary, theme.factcardsecondary]} style={styles.factCard}>
          <Card.Content>
            <Text style={[styles.factText,{ color: theme.text}]}>
              During pregnancy, the heart grows in size to pump up to 50% more blood for both mother and baby.
            </Text>
          </Card.Content>
        </LinearGradient>

        {/* Appointments */}
        <LinearGradient colors={[theme.appointment,theme.appointment]} style={styles.appointmentCard}>
          <Card.Title title="Appointments" titleStyle={[styles.cardTitle,{ color: theme.text}]}/>
          <Card.Content>

          {loading ? (
            <ActivityIndicator size="large" color="#FF4081" style={{ marginTop: 5 }} />
              ) : (
               <>
              {appointments.map((item) => (
                <View key={item.id}>
                  <View style={{ padding: 5, borderBottomWidth: 1 }}></View>
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.title}</Text>
                  <Text>{item.content}</Text>
                  <Text>Date: {item.appointment_date}</Text>
                  <Text>Time: {item.appointment_time}</Text>
                  <Text>Location: {item.appointment_location}</Text>
                  <Text>Status: {item.appointment_status}</Text>
                </View>
              ))}
            </>
          )}
            <Button mode="contained" onPress={() => navigation.navigate("Calendar")} style={[styles.addButton,{ backgroundColor: theme.button}]}>
              See More

            </Button>
          </Card.Content>
      </LinearGradient>


      {/* Horizontol Scroll for Due Tasks */}
      <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming / Due Tasks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {dueAppointments.map((item, index) => (
                <LinearGradient  key={index} colors={[theme.cardBackgroundprimary, theme.cardBackgroundsecondary]} style={styles.dueItem}>
                <View>
                  <Text style={styles.dueText}>{item}</Text>
                </View>
                </LinearGradient>
              ))}
            </ScrollView>
          </View>
          </ScrollView>

        <TouchableOpacity style={[styles.floatingButton,{ backgroundColor: theme.iconBackground}]} onPress={() => navigation.navigate('Chat')}>

          <MaterialIcons name="smart-toy" size={30} color="#fff" />
        </TouchableOpacity>
        </SafeAreaView>
        </>
  );
}

const WeekNumber = ({ number, active = false }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.weekNumber,
        { backgroundColor: active ? theme.primary : `${theme.primary}20` }
      ]}
    >
      <Text
        style={[
          styles.weekNumberText,
          { color: active ? theme.background : theme.primary }
        ]}
      >
        {number}
      </Text>
    </View>
  );
};

const { width,height } = Dimensions.get("window");

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
    // color: "#333",
  },
  title: {
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#333",
    marginRight: 2,
    marginLeft: -90,
    marginBottom: 20, 
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
    // backgroundColor: "rgb(218,79,122)",

    marginTop: 10,
    marginBottom: 10 

  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "rgba(0, 0, 0, 0.8)",
    marginBottom: 10,
  },

     // Due Appointments
  horizontalScroll: {
    flexDirection: "row",
    paddingBottom: 10,
  },
  dueItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    height:Math.min(height * 0.15, 110),
    width: width * 0.45,
    minWidth: 150,
  },
  dueText: {
    fontSize: width * 0.040,
    color: "#fff",
    textAlign: "center",
    maxWidth: "100%",
    flexWrap: "wrap",
    paddingHorizontal: 5,
  },

  //floating chatbot button
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },


sosButton: { 
  position: "absolute",
  top: 0, // Adjusted position to match the image better
  right: 15,
  paddingHorizontal: 10, 
  paddingVertical: 6,
  borderRadius: 20, 
  flexDirection: "row", 
  alignItems: "center",
  zIndex:100,
},
sosText: { 
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
    // backgroundColor: "rgba(255, 75, 110, 0.1)",
  },
  // weekNumberActive: {
  //   backgroundColor: "#FF4B6E",
  // },
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
