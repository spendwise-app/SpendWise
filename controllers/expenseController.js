import Expense from "../models/expenseModel.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import sendPushNotification from "../utilities/sendPushNotification.js";

export const createExpense = async (req, res) => {
  try {
    const { title, amount, category, date, sharedWith = [] } = req.body;

    const sharedWithData = sharedWith.map((item) => ({
      friend: item.friend,
      amount: item.amount,
      paid: item.paid || false,
    }));

    const newExpense = new Expense({
      user: req.userId,
      title,
      amount,
      category,
      date,
      createdBy: req.userId,
      sharedWith: sharedWithData,
    });
    await newExpense.save();

    const user = await User.findById(req.userId).select("name");

    await Promise.all(
      sharedWithData.map(async ({ friend, amount }) => {
        try {
          await sendPushNotification(
            friend,
            "New Shared Expense",
            `${
              user.name || "A User"
            } has shared an expense with you for ${amount}.`,
            "shared"
          );
        } catch (notificationError) {
          console.error(
            `Failed to send notification to user ${friend}:`,
            notificationError
          );
        }
      })
    );

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      newExpense,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: err.message,
    });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { today } = req.query;
    let filter = { user: req.userId };

    if (today === "true") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    let totalAmount = 0;
    if (today === "true") {
      totalAmount = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );
    }

    res.json({
      success: true,
      expenses,
      ...(today === "true" && { totalAmount }),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: err.message,
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Expense.findOneAndUpdate(
      { _id: id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    res.json({
      success: true,
      message: "Expense updated successfully",
      updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: err.message,
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findOneAndDelete({
      _id: id,
      user: req.userId,
    });
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete expense",
      error: err.message,
    });
  }
};

export const filterExpenses = async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      date,
      minAmount,
      maxAmount,
      groupByCategory,
      sortBy,
      order,
      page = 1,
      limit = 20,
    } = req.query;

    const userId = new mongoose.Types.ObjectId(String(req.userId));
    const filter = { user: userId };

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by date or date range
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    } else if (date) {
      const targetDate = new Date(date);
      const startOfDate = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDate = new Date(targetDate.setHours(23, 59, 59, 999));
      filter.date = { $gte: startOfDate, $lte: endOfDate };
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    let grouped;
    if (groupByCategory === "true") {
      grouped = await Expense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { totalAmount: order === "desc" ? -1 : 1 },
        },
      ]);
    }

    // Sorting
    const sort = sortBy
      ? { [sortBy]: order === "desc" ? -1 : 1 }
      : { date: -1 };

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const expenses = await Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Expense.countDocuments(filter);
    const totalAmount = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      count: totalCount,
      total: totalAmount[0]?.total || 0,
      grouped,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      expenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const sharedExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      "sharedWith.friend": req.userId,
    })
      .select("-__v")
      .populate("createdBy", "name email upiId")
      .sort({ date: -1 });

    const shared = expenses.map((expense) => {
      const userShare = expense.sharedWith.filter(
        (item) => item.friend.toString() === req.userId.toString()
      );
      return {
        ...expense.toObject(),
        sharedWith: userShare,
      };
    });

    res.json({ success: true, shared });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const acceptPaymentRequest = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.userId;
    const { friend, amount } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    const sharedEntry = expense.sharedWith.find(
      (entry) => entry.friend.toString() === friend.toString()
    );

    if (!sharedEntry) {
      return res
        .status(400)
        .json({ success: false, message: "You are not part of this expense" });
    }

    const friendExpense = new Expense({
      user: friend,
      title: expense.title,
      amount,
      category: expense.category,
      date: expense.date,
      createdBy: userId,
      sharedWith: [],
    });

    sharedEntry.paid = true;
    expense.amount = expense.amount - amount;
    await friendExpense.save();
    await expense.save();

    await User.findByIdAndUpdate(userId, {
      $pull: {
        inbox: { id: expenseId },
      },
    });

    try {
      const user = await User.findById(req.userId).select("name");
      await sendPushNotification(
        friend,
        "Payment Confirmed Accepted",
        `Your payment request has been confirmed by ${user.name}.`
      );
    } catch (err) {
      console.log(`Push notification error: ${err.message}`);
    }

    res
      .status(200)
      .json({ success: true, message: "Payment confirmed and inbox updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectPaymentRequest = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.userId;

    const userBeforeUpdate = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          inbox: { id: expenseId },
        },
      },
      { new: false } 
    );

    try {
      const removedItem = userBeforeUpdate.inbox.find(
        (item) => item.id.toString() === expenseId.toString()
      );
      await sendPushNotification(
        removedItem?.friend,
        "Payment Confirmed Rejected",
        `Your payment request has been rejected by ${removedItem?.name}.`
      );
    } catch (err) {
      console.log(`Push notification error: ${err.message}`);
    }

    res.status(200).json({ success: true, message: "Request rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
