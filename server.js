import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/db.js"
import authRoutes from './routes/authRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import cookieParser from 'cookie-parser';
import './utilities/weeklySummary.js'
import './utilities/sleepPreventer.js'


const PORT = process.env.PORT || 3000

connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  "http://localhost:5173",
  'https://expense-14.deno.dev',
  'https://spendwise.deno.dev',
  'https://spendwise-web.deno.dev'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

app.get("/ping", (req, res) => {
    res.json({message: "Pinged"})
})



app.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})
