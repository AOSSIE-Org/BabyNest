import notifee, { TriggerType, AndroidImportance, AndroidNotificationSetting } from '@notifee/react-native';
import { Platform, Alert } from 'react-native';
class NotificationService {
  constructor() {
    this.CHANNEL_ID = 'baby-nest-v2';
    // Async init moved to init() method
  }

  async init() {
    await this.createDefaultChannel();
    await this.configure();
  }

  async configure() {
    // Request permissions
    try {
      await notifee.requestPermission();
    } catch (e) {
      console.warn('[NotificationService] Failed to request permissions:', e);
    }
  }
  
    async hasAndroidExactAlarmPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const settings = await notifee.getNotificationSettings();
      return settings.android.alarm === AndroidNotificationSetting.ENABLED;
    }
    return true; 
  }

  async createDefaultChannel() {
    await notifee.createChannel({
      id: this.CHANNEL_ID,
      name: 'BabyNest Notifications',
      description: "Reminders for your baby's journey",
      sound: 'default',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  }

  async showLocalNotification(title, message) {
    await notifee.displayNotification({
      title: title || "Local Notification",
      body: message || "My Notification Message",
      android: {
        channelId: this.CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
      },
    });
  }

  async scheduleAppointmentReminder(title, content, dateStr, timeStr, id) {
      const hasPermission = await this.hasAndroidExactAlarmPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "This app needs exact alarm permission to send time-critical reminders. Please enable it in the app settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => notifee.openAlarmPermissionSettings() }
          ]
        );
        return;
      }

      // Input Validation
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const timePattern = /^\d{1,2}:\d{2}$/;

      if (!dateStr || !timeStr || !datePattern.test(dateStr) || !timePattern.test(timeStr)) {
          console.error('[NotificationService] Invalid date or time format:', { dateStr, timeStr });
          return;
      }
       const [year, month, day] = dateStr.split('-').map(Number);
       // Handle time effectively (e.g. "14:30")
       const [hours, minutes] = timeStr.split(':').map(Number);
       const date = new Date(year, month - 1, day, hours, minutes, 0);
       
       const REMINDER_OFFSET_MINUTES = 5;
       const reminderDate = new Date(date.getTime() - REMINDER_OFFSET_MINUTES * 60000); 
       
       const now = new Date();
       let scheduleDate = reminderDate;
       let message = `in ${REMINDER_OFFSET_MINUTES} minutes`;

       if (reminderDate <= now) {
           // If we are already within the reminder window (or past it), warn immediately
           scheduleDate = new Date(Date.now() + 1000); // 1 second delay
           const diffMins = Math.ceil((date - now) / 60000);
           if (diffMins > 0) {
              message = `in ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
           } else {
              message = "now";
           }
       }

       await this.scheduleNotification(
           `Upcoming Appointment: ${title}`,
           `Your appointment is ${message}! ${content || ""}`,
           scheduleDate,
           id
       );
  }

  async scheduleNotification(title, message, date, id) {
    let dateISO = 'invalid date';
    try {
        dateISO = date.toISOString();
    } catch (e) {
        // ignore invalid date for logging
    }
    console.log('[NotificationService] Scheduling:', {title, date, dateISO, id});
    
    // Ensure date is in the future for the trigger
    const now = Date.now();
    let triggerTimestamp = date.getTime();
    
    if (triggerTimestamp <= now) {
         console.warn('[NotificationService] Scheduled time is in the past. Adjusting to now + 500ms.');
         triggerTimestamp = now + 500;
    }

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTimestamp, 
    };

    try {
      await notifee.createTriggerNotification(
        {
          id: id ? String(id) : undefined,
          title: title || "Scheduled Notification",
          body: message || "My Notification Message",
          android: {
            channelId: this.CHANNEL_ID,
            pressAction: {
              id: 'default',
            },
          },
        },
        trigger,
      );
    } catch (e) {
      console.error('[NotificationService] Error scheduling notification:', e);
    }
  }

  async getScheduledNotifications(callback) {
    const notifications = await notifee.getTriggerNotifications();
    console.log('[NotificationService] Retrieved scheduled:', notifications);
    if (callback) {
      callback(notifications);
    }
    return notifications;
  }
  
  async cancelNotification(id) {
    await notifee.cancelNotification(String(id));
  }
  
  async cancelAll() {
      await notifee.cancelAllNotifications();
  }
}

export default new NotificationService();
