import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,   // Finance apps shouldn't make noise
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type ScheduledNotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'daily_reminder'
  | 'goal_milestone';

export const notificationService = {
  // Must be called before any notification scheduling
  async requestPermission(): Promise<boolean> {
    // Notifications only work on physical devices
    if (!Device.isDevice) {
      console.warn('Notifications require a physical device');
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();

    // Android 13+ requires explicit POST_NOTIFICATIONS permission
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vault-alerts', {
        name: 'Vault Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
      });
    }

    return status === 'granted';
  },

  // Fire immediately — used for budget warnings after saving a transaction
  async sendLocalNotification(
    title: string,
    body: string,
    data: Record<string, string> = {}
  ): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        // Android notification channel
        ...(Platform.OS === 'android' && { channelId: 'vault-alerts' }),
      },
      trigger: null, // null = fire immediately
    });
  },

  // Schedule daily reminder at a specific hour
  async scheduleDailyReminder(hour: number = 20): Promise<string> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return '';

    // Cancel any existing daily reminder before scheduling new one
    await this.cancelByType('daily_reminder');

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Don't forget to log today's expenses",
        body: 'Keep your Vault up to date for accurate insights.',
        data: { type: 'daily_reminder' },
        ...(Platform.OS === 'android' && { channelId: 'vault-alerts' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });

    return id;
  },

  // Budget warning — called from useCreateTransaction mutation's onSuccess
  async sendBudgetWarning(
    categoryName: string,
    percentUsed: number,
    remaining: number
  ): Promise<void> {
    const isExceeded = percentUsed >= 100;
    const title = isExceeded
      ? `${categoryName} budget exceeded`
      : `${categoryName} budget at ${Math.round(percentUsed)}%`;

    const body = isExceeded
      ? `You've gone over your ${categoryName} budget this month.`
      : `Only $${(remaining / 100).toFixed(2)} remaining in your ${categoryName} budget.`;

    await this.sendLocalNotification(title, body, {
      type: isExceeded ? 'budget_exceeded' : 'budget_warning',
      category: categoryName,
    });
  },

  // Goal milestone notification
  async sendGoalMilestone(goalName: string, percent: number): Promise<void> {
    if (percent !== 25 && percent !== 50 && percent !== 75 && percent !== 100) return;

    const title = percent === 100
      ? `Goal reached! 🎯`
      : `${Math.round(percent)}% of the way there!`;

    const body = percent === 100
      ? `You've reached your "${goalName}" savings goal!`
      : `You're ${Math.round(percent)}% of the way to your "${goalName}" goal. Keep it up!`;

    await this.sendLocalNotification(title, body, {
      type: 'goal_milestone',
      goal: goalName,
    });
  },

  async cancelByType(type: ScheduledNotificationType): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(
      (n) => n.content.data?.['type'] === type
    );
    await Promise.all(
      toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Listen for notification taps — navigate to relevant screen
  addResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },
};