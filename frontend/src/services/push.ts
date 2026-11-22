import api from './api';

export interface PushResult {
  status: 'subscribed' | 'denied' | 'unsupported' | 'error';
  message: string;
}

// The subscription's applicationServerKey must be a raw Uint8Array, while the
// VAPID public key travels as base64url.
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
};

export const enablePushNotifications = async (): Promise<PushResult> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { status: 'unsupported', message: 'This browser does not support push notifications.' };
  }

  // Safari and Chrome only allow push on HTTPS (or localhost). A phone opening
  // http://192.168.x.x gets a non-secure context, so explain that instead of
  // failing silently.
  if (!window.isSecureContext) {
    return {
      status: 'unsupported',
      message: 'Push notifications need HTTPS (or localhost). Open the site over HTTPS to enable them.',
    };
  }

  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    return {
      status: 'denied',
      message: 'Notifications are blocked. Allow them in your browser settings, then try again.',
    };
  }
  if (permission !== 'granted') {
    return { status: 'error', message: 'Notification permission was not granted.' };
  }

  try {
    const { data } = await api.get('/push/public-key');
    const registration = await navigator.serviceWorker.register('/sw.js');
    const existing = await registration.pushManager.getSubscription();

    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });

    await api.post('/push/subscribe', subscription.toJSON());
    return { status: 'subscribed', message: 'Order notifications are on.' };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Could not enable notifications. Please try again.',
    };
  }
};
