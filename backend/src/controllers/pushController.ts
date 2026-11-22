import { Request, Response } from 'express';
import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

let vapidReady = false;

// Push is optional: if the VAPID keys are missing the rest of the app keeps
// working and only the push send silently does nothing.
const configureVapid = () => {
  if (vapidReady) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@nappa.local',
    publicKey,
    privateKey
  );
  vapidReady = true;
  return true;
};

export const getPublicKey = (_req: Request, res: Response) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return res.status(503).json({ message: 'Push notifications are not configured.' });
  res.json({ publicKey });
};

export const subscribe = async (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid push subscription.' });
    }

    // Same browser logging in as another account simply moves the endpoint.
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.userId, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Push notifications enabled.' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ message: 'Could not save this device for notifications.' });
  }
};

export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ message: 'Missing push endpoint.' });
    await PushSubscription.deleteOne({ endpoint, user: req.userId });
    res.json({ message: 'Push notifications disabled.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not disable notifications.' });
  }
};

// Fire-and-forget from the order controllers. Never throws, so a push failure
// can never break checkout or an order update.
export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  if (!configureVapid()) return;
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            JSON.stringify(payload)
          );
        } catch (error: any) {
          // 404/410 means the browser dropped this subscription — clean it up.
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await sub.deleteOne();
          } else {
            console.error('Push send failed:', error?.message || error);
          }
        }
      })
    );
  } catch (error) {
    console.error('Push lookup failed:', error);
  }
};
