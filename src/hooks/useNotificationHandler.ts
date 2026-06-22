import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications/notificationService';

// Called once in the root layout — sets up global notification tap handling
export function useNotificationHandler() {
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notificationService.requestPermission();

    // Schedule daily reminder at 8pm on first app open
    notificationService.scheduleDailyReminder(20);

    // Handle taps on notifications
    responseListenerRef.current = notificationService.addResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        const type = data?.['type'] as string | undefined;

        // Navigate to relevant screen based on notification type
        switch (type) {
          case 'budget_warning':
          case 'budget_exceeded':
            router.push('/(tabs)/insights');
            break;
          case 'daily_reminder':
            router.push('/(tabs)/add');
            break;
          case 'goal_milestone':
            router.push('/(tabs)/goals');
            break;
        }
      }
    );

    return () => {
      responseListenerRef.current?.remove();
    };
  }, []);
}