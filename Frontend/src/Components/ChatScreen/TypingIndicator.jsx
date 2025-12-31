import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TypingIndicator() {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.container}>
       {/* Bot Avatar - Matching MessageList */}
       <View style={styles.botAvatar}>
         <Icon name="smart-toy" size={20} color="rgb(218,79,122)" /> 
       </View>
       
       {/* Bubble with Text and Dots */}
       <View style={styles.contentContainer}>
          <Text style={styles.text}>BabyNest is thinking</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: fadeAnim  }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim  }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim  }]} />
          </View>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: 'flex-end', // Align bottom like a chat bubble
    paddingRight: 20,
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218,79,122,0.2)',
    marginRight: 8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  text: {
    color: '#666',
    fontSize: 14,
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 4, // slight optical adjustment
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgb(218,79,122)", // Theme color
    marginHorizontal: 2,
  },
});
