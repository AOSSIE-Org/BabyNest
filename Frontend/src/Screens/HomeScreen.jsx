import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {BASE_URL} from '@env';
import {useDrawer} from '../context/DrawerContext';
import {babySizes} from '../data/babySizes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable } from 'react-native';
import { getProfile } from '../storage/profile';
import { getAppointments } from '../storage/appointments';

export default function HomeScreen({ navigation }) {
  console.log(BASE_URL);
  const [dueDate, setDueDate] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [currentBabySize, setCurrentBabySize] = useState('');
  const weekScrollRef = useRef(null);
  const {openDrawer} = useDrawer();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

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
  });

  const fetchData = async () => {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const getProfileData = await getProfile(user_id);
      const profileData = getProfileData.data;
      const fetchedDueDate = profileData?.dueDate;

      if (fetchedDueDate) {
        setDueDate(fetchedDueDate);
        console.log(' Due Date:', fetchedDueDate); // Debugging line

        const calculatedWeek = calculateCurrentWeek(fetchedDueDate);
        setCurrentWeek(calculatedWeek);
        setCurrentBabySize(babySizes[calculatedWeek - 1]);
        scrollToWeek(calculatedWeek);
      }

      try {
        const appointments_response = await getAppointments(user_id);
        const apptData = appointments_response.data;
        if (!appointments_response.success) {
          throw new Error(appointments_response.error.message);
        }

        setAllAppointments(apptData || []);
      } catch (error) { 
        console.log("Error while fetching appointments > HomeScreen.jsx:", error);
      }
      
      const taskRes = await fetch(`${BASE_URL}/get_tasks`);
      const taskData = await taskRes.json();
      setAllTasks(taskData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateCurrentWeek = dueDateString => {
    const dueDateObj = new Date(dueDateString);
    const conceptionDate = new Date(dueDateObj);
    conceptionDate.setDate(conceptionDate.getDate() - 280);

    const now = new Date();
    const diffInMs = now - conceptionDate;
    const week = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
    return Math.min(Math.max(week, 1), 40);
  };

  const scrollToWeek = week => {
    setTimeout(() => {
      const scrollX = (week - 1) * 50 - 160;
      weekScrollRef.current?.scrollTo({x: scrollX, animated: true});
    }, 300);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleWeekSelect = week => {
    setCurrentWeek(week);
    setCurrentBabySize(babySizes[week - 1]);
  };

  // ? Corrected Filtering Logic for Appointments (using date)
  const filteredAppointments = allAppointments
    .map(appt => {
      const appointmentDate = new Date(appt.appointment_date);
      const pregnancyStartDate = new Date(dueDate);
      pregnancyStartDate.setDate(pregnancyStartDate.getDate() - 280);
      const diffInMs = appointmentDate - pregnancyStartDate;
      const weekNumber = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
      return {...appt, week_number: weekNumber};
    })
    .filter(appt => appt.week_number === currentWeek)
    .sort((a, b) => a.week_number - b.week_number)

  const filteredTasks = allTasks
    .filter(task => parseInt(task.starting_week) >= currentWeek)
    .sort((a, b) => parseInt(a.starting_week) - parseInt(b.starting_week))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F8" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer}>
            <Icon name="menu" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.appName}>BabyNest</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image
              source={
                profileImage
                  ? {uri: profileImage}
                  : require('../assets/Avatar.jpeg')
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* Baby Info */}
        <View style={styles.babyInfoContainer}>
          <Image
            source={require('../assets/Baby.jpeg')}
            style={styles.babyImage}
          />
          <View style={styles.babyInfo}>
            <Text style={styles.weekText}>Week {currentWeek}</Text>
            <Text style={styles.babySize}>
              {currentWeek >= 4 && 'Size of '}
              {currentBabySize}
            </Text>
            <Text style={styles.dueDate}>
              Due:{' '}
              {dueDate
                ? new Date(dueDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Not available'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Pregnancy Timeline</Text>
          <ScrollView
            horizontal
            ref={weekScrollRef}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timelineScroll}>
            {Array.from({length: 40}, (_, i) => i + 1).map(week => (
              <TouchableOpacity
                key={week}
                style={[
                  styles.weekBubble,
                  currentWeek === week && styles.activeWeekBubble,
                ]}
                onPress={() => handleWeekSelect(week)}>
                <Text
                  style={[
                    styles.weekNumber,
                    currentWeek === week && styles.activeWeekNumber,
                  ]}>
                  {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {filteredAppointments.map((appt, idx) => (
            <Pressable
              key={idx}
              style={styles.card}
              onPress={() =>
                navigation.jumpTo('Calendar', {
                  appointment_date: appt.appointment_date,
                  appointment_time: appt.appointment_time,
                })
              }>
              <Icon name="calendar" size={20} color="rgb(218,79,122)" />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{appt.title}</Text>
                <Text>
                  {appt.appointment_date} at {appt.appointment_time}
                </Text>
                <Text>{appt.appointment_location}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Tasks</Text>
          {filteredTasks.map((task, idx) => (
            <View key={idx} style={styles.card}>
              <Icon
                name="checkmark-circle-outline"
                size={20}
                color="rgb(218,79,122)"
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                <Text>
                  {task.starting_week === task.ending_week
                    ? `Week ${task.starting_week}`
                    : `Weeks ${task.starting_week}-${task.ending_week}`}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Floating Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.jumpTo('Chat')}>
          <MaterialIcons name="smart-toy" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFF5F8'},
  scrollContent: {paddingBottom: 100},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(218,79,122)',
  },
  profileImage: {width: 40, height: 40, borderRadius: 20},
  babyInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    elevation: 3,
  },
  babyImage: {width: 100, height: 100, borderRadius: 50},
  babyInfo: {marginLeft: 20, justifyContent: 'center', flex: 1},
  weekText: {fontSize: 22, fontWeight: 'bold'},
  babySize: {fontSize: 14, color: '#555', marginTop: 4},
  dueDate: {fontSize: 14, color: 'rgb(218,79,122)', marginTop: 4},
  timelineContainer: {paddingHorizontal: 20, marginTop: 10},
  timelineScroll: {paddingVertical: 10},
  weekBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEEF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activeWeekBubble: {backgroundColor: 'rgb(218,79,122)'},
  weekNumber: {fontWeight: '600', color: 'rgb(218,79,122)'},
  activeWeekNumber: {color: '#fff'},
  section: {paddingHorizontal: 20, marginTop: 30},
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {marginLeft: 12},
  cardTitle: {fontWeight: 'bold', fontSize: 16},
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgb(218,79,122)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 999,
  },
});
