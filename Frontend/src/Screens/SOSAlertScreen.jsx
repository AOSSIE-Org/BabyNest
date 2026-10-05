import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SOSAlertScreen({navigation}) {
  const [tapCount, setTapCount] = useState(0);

  const handleTap = () => {
    if (tapCount >= 3) {
      navigation.navigate('EmergencyCalling');
    } else {
      setTapCount(tapCount + 1);
    }
  };

  return (
    <TouchableOpacity style={styles.alertContainer} onPress={handleTap}>
      <View style={styles.alertCircle}>
        <Icon name="power" size={60} color="white" />
      </View>
      <Text style={styles.alertText}>Tap 4 Times on Screen to Alert</Text>
      <Text style={styles.subText}>Taps: {tapCount}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE8E5',
  },
  alertCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF6F61',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subText: {
    fontSize: 16,
    color: 'gray',
    marginTop: 10,
  },
});
