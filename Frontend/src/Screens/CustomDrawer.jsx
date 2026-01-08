import React, { useRef, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Easing,
} from 'react-native';
import { DrawerContext } from '../context/DrawerContext';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { BASE_URL } from '@env';
import Icon from 'react-native-vector-icons/Ionicons';

const DRAWER_WIDTH = 260;

export default function CustomDrawer({ children }) {
  const navigation = useNavigation();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isAnimatingRef = useRef(false);

  const openDrawer = () => {
    if (isAnimatingRef.current || isDrawerOpen) return;

    isAnimatingRef.current = true;
    setIsDrawerOpen(true);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 350,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimatingRef.current = false;
    });
  };

  const closeDrawer = (cb) => {
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 350,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      isAnimatingRef.current = false;
      if (!finished) return;

      setIsDrawerOpen(false);
      cb?.();
    });
  };

  const navigateTo = (screen) => {
    closeDrawer(() => {
      if (screen === 'Home') {
        navigation.navigate('MainTabs', { screen: 'Home' });
      } else {
        navigation.navigate(screen);
      }
    });
  };

  const handleLogout = async () => {
    if (isAnimatingRef.current) return;

    try {
      const res = await fetch(`${BASE_URL}/delete_profile`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data?.error) {
        Alert.alert('Logout Failed', data.error);
        return;
      }

      closeDrawer(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          })
        );
      });
    } catch {
      Alert.alert('Logout Error', 'Unable to logout. Please try again.');
    }
  };

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer }}>
      <View style={{ flex: 1 }}>

          {/* Main Content */}
        <View style={{ flex: 1 }}>
          {children}
          </View>
          
          {/*BackDrop*/}
        {isDrawerOpen && (
          <Animated.View 
            style={[
              styles.backdrop,
              { opacity: backdropOpacity }
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => closeDrawer()}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        )}

          {/* Animated Drawer Panel */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          
          <View style={styles.drawerTopHeader}>
            <Text style={styles.drawerHeader}>BabyNest</Text>
            <TouchableOpacity onPress={() => closeDrawer()}>
              <Icon name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

           <TouchableOpacity onPress={() => navigateTo('Home')} style={styles.link}>
            <Text>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('AllTasks')} style={styles.link}>
            <Text>Tasks & AI Recommendations</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('Weight')} style={styles.link}>
            <Text>Weight Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('Medicine')} style={styles.link}>
            <Text>Medicine Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('Symptoms')} style={styles.link}>
            <Text>Symptoms Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('BloodPressure')} style={styles.link}>
            <Text>Blood Pressure Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('Discharge')} style={styles.link}>
            <Text>Discharge Tracking</Text>
          </TouchableOpacity>

          <View style={styles.logoutContainer}>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    elevation: 5,
    zIndex: 1000,
  },

  drawerTopHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  },

  drawerHeader: {
  fontSize: 22,
  fontWeight: 'bold',
  color: 'rgb(218,79,122)',
  },

  link: {
    paddingVertical: 12,
  },
  logoutContainer: {
    marginBottom: 30,
  },
  logoutText: {
    color: 'red',
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
