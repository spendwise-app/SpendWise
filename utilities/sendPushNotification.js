import { subscriptions, webpush } from "../config/webpush.js";

const sendPushNotification = async (userId, title, body) => {
  const subscription = subscriptions[userId];
  if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

  const notificationPayload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
  });

  try {
    await webpush.sendNotification(subscription, notificationPayload);
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

export default sendPushNotification;