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
    res.status(200).json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ message: 'Error sending notification' });
  }
}

export default sendPushNotification;