import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/db.js"
import authRoutes from './routes/authRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import userRoutes from './routes/userRoutes.js'
import cookieParser from 'cookie-parser';
import './utilities/weeklySummary.js'
import './utilities/sleepPreventer.js'


const PORT = process.env.PORT || 3000

connectDB();

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/user', userRoutes)

app.get("/ping", (req, res) => {
    res.json({message: "Pinged"})
})



app.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})