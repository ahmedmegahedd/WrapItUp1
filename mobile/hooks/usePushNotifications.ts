import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Push is not supported in Expo Go; only in development builds. */
const isExpoGo = Constants.appOwnership === 'expo';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const listener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!Device.isDevice) return;

    listener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});

    (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let final = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        final = status;
      }
      setPermission(final === 'granted');

      if (final !== 'granted') return;
      if (isExpoGo) return;

      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        setExpoPushToken(token);
      } catch (_) {
        // No projectId in Expo Go / bare without EAS config
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    })();

    return () => {
      listener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, []);

  return { expoPushToken, permission };
}
