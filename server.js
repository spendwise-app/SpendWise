import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import borrowLendRoutes from "./routes/borrowLendRoutes.js";
import friendRoutes from "./routes/friendRoutes.js"
import feedbackRoute from "./routes/feedbackRoute.js"
import cookieParser from "cookie-parser";
import "./utilities/weeklySummary.js";
import "./utilities/sleepPreventer.js";
import { webpush, subscriptions } from "./config/webpush.js";

const PORT = process.env.PORT || 3000;

connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5174",
  "http://127.0.0.1:5000",
  "https://spendwise.deno.dev",
  "https://spendwise-web.deno.dev",
  "https://spendwise-test.deno.dev",
  "http://192.168.1.71:5174",
  "https://spendwise25.netlify.app",
  "https://spendwise-web.netlify.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/borrowlend", borrowLendRoutes);
app.use("/api/friend", friendRoutes)
app.use("/api/feedback", feedbackRoute);




// Push Notification
app.post('/api/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  subscriptions[userId] = subscription;
  res.status(201).json({ message: 'Subscribed' });
});

app.post('/api/notify', async (req, res) => {
  const { userId } = req.body;
  const subscription = subscriptions[userId];
  if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

  const notificationPayload = JSON.stringify({
    title: 'Test Message',
    body: 'Hello World',
    icon: '/icon-192.png',
  });

  try {
    await webpush.sendNotification(subscription, notificationPayload);
    res.status(200).json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ message: 'Error sending notification' });
  }
})



app.get("/ping", (req, res) => {
  res.json({ message: "Pinged" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
