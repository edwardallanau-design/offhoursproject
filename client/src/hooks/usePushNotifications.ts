import { useEffect } from 'react';
import { api } from '../lib/api';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

export const usePushNotifications = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const { data } = await api.get('/notifications/vapid-public-key');
        const publicKey = data.data.publicKey;

        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await api.post('/notifications/push-subscription', { subscription: existing.toJSON() }).catch(() => {});
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await api.post('/notifications/push-subscription', { subscription: subscription.toJSON() });
      } catch (err) {
        console.warn('Push notification setup failed:', err);
      }
    };

    register();

    // Handle navigation messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE') {
        window.location.href = event.data.path;
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);
};
