import React, { useRef, useState, useEffect } from 'react';
import { Animated, View, Dimensions, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, StatusBar } from 'react-native';
import { DrawerContext } from '../context/DrawerContext';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { BASE_URL } from '@env';

const DRAWER_WIDTH = 260;

export default function CustomDrawer({ children }) {
  const navigation = useNavigation();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const openDrawer = () => {
    if (isMounted.current) {
      setIsDrawerOpen(true);
    }
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isMounted.current) {
        setIsDrawerOpen(false);
      }
    });
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
        {/* Main Content */}
        <View style={{ flex: 1 }} pointerEvents={isDrawerOpen ? 'none' : 'auto'}>
          {children}
        </View>

        {/* Backdrop Overlay */}
        {isDrawerOpen && (
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backdropTouchable}
              activeOpacity={1}
              onPress={closeDrawer}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close drawer"
            />
          </Animated.View>
        )}

        {/* Animated Drawer Panel */}
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX }] }]}
          pointerEvents={isDrawerOpen ? 'auto' : 'none'}
        >
          <StatusBar backgroundColor="#fff" barStyle="dark-content" />

          {/* Drawer Header with Close Button */}
          <View style={styles.drawerHeaderContainer}>
            <Text style={styles.drawerHeader}>BabyNest</Text>
            <TouchableOpacity
              onPress={closeDrawer}
              style={styles.closeButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close drawer"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Drawer Content */}
          <ScrollView
            style={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity onPress={() => navigateTo('Home')} style={styles.link}>
              <Text style={styles.linkText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo('Tasks')} style={styles.link}>
              <Text style={styles.linkText}>Tasks & AI Recommendations</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo('Weight')} style={styles.link}>
              <Text style={styles.linkText}>Weight Tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo('Medicine')} style={styles.link}>
              <Text style={styles.linkText}>Medicine Tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo('Symptoms')} style={styles.link}>
              <Text style={styles.linkText}>Symptoms Tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo('BloodPressure')} style={styles.link}>
              <Text style={styles.linkText}>Blood Pressure Tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateTo('Discharge')} style={styles.link}>
              <Text style={styles.linkText}>Discharge Tracking</Text>
            </TouchableOpacity>

            <View style={styles.logoutContainer}>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}


const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  backdropTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    paddingTop: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
  drawerHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgb(218,79,122)',
  },
  closeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  link: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  linkText: {
    fontSize: 16,
    color: '#333',
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

