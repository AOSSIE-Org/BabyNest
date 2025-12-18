import React, { useRef } from 'react';
import { Animated, View, Dimensions, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { DrawerContext } from '../context/DrawerContext';
import { useNavigation,CommonActions } from '@react-navigation/native';
import {BASE_URL} from '@env';

const DRAWER_WIDTH = 260;

export default function CustomDrawer({ children }) {
  const navigation = useNavigation();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const openDrawer = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const navigateTo = (screen) => {
    closeDrawer();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/delete_profile`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.error) {
        closeDrawer();
        navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            })
          );
      } else {
        Alert.alert("Logout Failed", data.error || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Logout Error", "Unable to logout. Please try again.");
    }
  };

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer }}>
      <View style={{ flex: 1 }}>
        {/* Animated Drawer Panel */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <Text style={styles.drawerHeader}>BabyNest</Text>
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

        {/* Main Content */}
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
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
  drawerHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
