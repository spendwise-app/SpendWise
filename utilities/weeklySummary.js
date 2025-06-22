import cron from 'node-cron';
import User from '../models/userModel.js';
import Expense from '../models/expenseModel.js';
import transporter from './transporter.js';
import { generateWeeklySummaryEmail } from './templates.js';
import { DateTime } from 'luxon';

const getStartAndEndOfWeek = () => {
  const now = DateTime.now().setZone('Asia/Kolkata');
  const start = now.startOf('week').startOf('day');
  const end = start.plus({ days: 6 }).endOf('day');
  return { start: start.toJSDate(), end: end.toJSDate() };
};

const sendWeeklySummaries = async () => {
  const users = await User.find({getSummary: true});

  const { start, end } = getStartAndEndOfWeek();

  for (const user of users) {
    const expenses = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const total = expenses.reduce((sum, item) => sum + item.total, 0);

    const html = generateWeeklySummaryEmail(user.name, expenses.map(e => ({
      category: e._id,
      total: e.total,
    })), total);

    await transporter.sendMail({
      from: `"SpendWise" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Weekly Expense Summary',
      html,
    });

    console.log(`Summary sent to ${user.email}`);
  }
};


cron.schedule('0 8 * * 0', sendWeeklySummaries);
