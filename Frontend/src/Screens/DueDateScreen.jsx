import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function DueDateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { dueDate } = route.params || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LottieView
          source={require('../assets/animations/celebration.json')}
          autoPlay
          loop={false}
          style={styles.animation}
        />
        <Text style={styles.message}>Your expected due date is:</Text>
        <Text style={styles.date}>
          {dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          }) : 'Not available'}
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  date: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4081',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  animation: {
    width: width,
    height: Math.min(300, height * 0.35),
  },
});
