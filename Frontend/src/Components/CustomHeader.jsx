import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
export default function CustomHeader() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const openDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <>
      <LinearGradient
        colors={[theme.cardBackgroundprimary, theme.cardBackgroundsecondary]}
        style={styles.container}>
        <StatusBar backgroundColor={theme.background}barStyle={theme.text} />
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Icon name="menu" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.title,{color: theme.text}]}>Home</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.profileButton}>
            <Image
              source={require('../assets/Avatar.jpeg')}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1957',
    marginBottom: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  menuButton: {
    padding: 8,
    color: '#fff',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
