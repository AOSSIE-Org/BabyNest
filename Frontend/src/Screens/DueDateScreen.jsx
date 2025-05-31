import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 18,
    marginBottom: 10,
  },
  date: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4081',
  },
  animation: {
    width: Dimensions.get('window').width,
    height: 300,
  },
});
