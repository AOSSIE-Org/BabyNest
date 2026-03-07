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

export default function HomeScreen({navigation}) {
  const [dueDate, setDueDate] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [allAppointments, setAllAppointments] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [currentBabySize, setCurrentBabySize] = useState('');
  const weekScrollRef = useRef(null);
  const {openDrawer} = useDrawer();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileRes = await fetch(`${BASE_URL}/get_profile`);
      const profileData = await profileRes.json();
      const fetchedDueDate = profileData?.due_date;

      if (fetchedDueDate) {
        setDueDate(fetchedDueDate);
        console.log(' Due Date:', fetchedDueDate); // Debugging line

        const calculatedWeek = calculateCurrentWeek(fetchedDueDate);
        setCurrentWeek(calculatedWeek);
        setCurrentBabySize(babySizes[calculatedWeek - 1]);
        scrollToWeek(calculatedWeek);
      }

      const apptRes = await fetch(`${BASE_URL}/get_appointments`);
      const apptData = await apptRes.json();
      setAllAppointments(apptData || []);

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

  // ? Corrected Filtering Logic for Appointments (using real-time date)
  const filteredAppointments = allAppointments
    .map(appt => {
      if (!appt.appointment_date || !appt.appointment_time) return null;
      const [year, month, day] = appt.appointment_date.split('-').map(Number);
      const [hours, minutes] = appt.appointment_time.split(':').map(Number);
      const apptDate = new Date(year, month - 1, day, hours, minutes);
      return {...appt, apptDate};
    })
    .filter(appt => appt && appt.apptDate >= new Date()) // Future only
    .sort((a, b) => a.apptDate - b.apptDate) // Soonest first
    .slice(0, 2);

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
              source={require('../assets/Avatar.jpeg')}
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
            <View key={idx} style={[styles.card, styles.appointmentCard]}>
              <View style={styles.dateBox}>
                 <Text style={styles.dateDay}>{new Date(appt.apptDate).getDate()}</Text>
                 <Text style={styles.dateMonth}>{new Date(appt.apptDate).toLocaleString('default', { month: 'short' })}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{appt.title}</Text>
                <View style={styles.row}>
                    <Icon name="time-outline" size={14} color="#666" style={{marginRight: 4}} />
                    <Text style={styles.subText}>
                    {appt.appointment_time}
                    </Text>
                </View>
                {appt.appointment_location ? (
                    <View style={styles.row}>
                        <Icon name="location-outline" size={14} color="#666" style={{marginRight: 4}} />
                        <Text style={styles.subText}>{appt.appointment_location}</Text>
                    </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Tasks</Text>
          {filteredTasks.map((task, idx) => (
            <View key={idx} style={[styles.card, styles.taskCard]}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                <Text style={styles.subText}>
                  {task.starting_week === task.ending_week
                    ? `Week ${task.starting_week}`
                    : `Weeks ${task.starting_week}-${task.ending_week}`}
                </Text>
              </View>
              <Icon
                name="ellipse-outline"
                size={24}
                color="rgb(218,79,122)"
              />
            </View>
          ))}
        </View>

        {/* Floating Button */}
        <TouchableOpacity style={styles.floatingButton}>
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
    alignItems: 'center',
  },
  appointmentCard: {
    justifyContent: 'flex-start', // Keep items together
  },
  taskCard: {
    justifyContent: 'space-between', // Push items apart
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  dateBox: {
      backgroundColor: '#FFF5F8',
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
      minWidth: 50,
  },
  dateDay: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'rgb(218,79,122)',
  },
  dateMonth: {
      fontSize: 12,
      color: 'rgb(218,79,122)',
      textTransform: 'uppercase',
  },
  cardTitle: {fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 4},
  subText: {color: '#666', fontSize: 14},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 2},
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgb(218,79,122)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});