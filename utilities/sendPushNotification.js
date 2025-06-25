import { subscriptions, webpush } from "../config/webpush.js";

const sendPushNotification = async (userId, title, body, url="") => {
  const subscription = subscriptions[userId];
  if (!subscription) return;

  const notificationPayload = JSON.stringify({
    title,
    body,
    url,
    icon: '/icon-192.png',
  });

  try {
    await webpush.sendNotification(subscription, notificationPayload);
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

export default sendPushNotification;