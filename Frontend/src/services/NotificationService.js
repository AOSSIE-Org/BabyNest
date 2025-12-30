import PushNotification from 'react-native-push-notification';

/**
 * Initialize notification system
 * Call this ONCE when app starts
 */
export const initNotifications = () => {
  // ✅ ANDROID CHANNEL (MANDATORY)
  PushNotification.createChannel(
    {
      channelId: 'default-channel-id',
      channelName: 'BabyNest Notifications',
      channelDescription: 'Reminders for appointments and medicines',
      importance: 4,
      vibrate: true,
    },
    (created) => console.log('Notification channel created:', created)
  );

  // ✅ CONFIGURATION
  PushNotification.configure({
    onNotification: function (notification) {
      console.log('Notification received:', notification);
    },

    popInitialNotification: true,
    requestPermissions: true,
  });
};

/**
 * Schedule a local notification
 */
export const scheduleNotification = (title, message, date) => {
  PushNotification.localNotificationSchedule({
    channelId: 'default-channel-id',
    title,
    message,
    date: new Date(date),
    allowWhileIdle: true,
  });
};