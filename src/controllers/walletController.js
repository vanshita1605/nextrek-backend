// src/controllers/walletController.js
const Wallet = require('../models/Wallet');
const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const Trip = require('../models/Trip');
const User = require('../models/User');
const BudgetService = require('../services/budgetService');
const SplitService = require('../services/splitService');

// Create wallet
exports.createWallet = async (req, res) => {
  try {
    const { tripId, users = [], currency = 'INR' } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required',
      });
    }

    // Check if trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ tripId });
    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet already exists for this trip',
      });
    }

    // Prepare users array with trip participants if not provided
    let walletUsers = [];
    if (users.length > 0) {
      walletUsers = await Promise.all(
        users.map(async (u) => {
          const user = await User.findById(u.userId);
          return {
            userId: u.userId,
            email: user?.email || '',
            name: user ? `${user.firstName} ${user.lastName}` : '',
            balance: u.initialBalance || 0,
          };
        })
      );
    } else {
      // Use trip participants
      walletUsers = await Promise.all(
        trip.participants.map(async (p) => {
          const user = await User.findById(p.userId);
          return {
            userId: p.userId,
            email: user?.email || '',
            name: user ? `${user.firstName} ${user.lastName}` : '',
            balance: 0,
          };
        })
      );
    }

    const totalBalance = walletUsers.reduce((sum, u) => sum + u.balance, 0);

    // Create wallet
    const wallet = new Wallet({
      tripId,
      users: walletUsers,
      totalBalance,
      currency,
      status: 'active',
    });

    await wallet.save();

    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      data: {
        walletId: wallet._id,
        tripId,
        users: walletUsers,
        totalBalance,
        currency,
        status: wallet.status,
      },
    });
  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create wallet',
      error: error.message,
    });
  }
};

// Get wallet by trip ID
exports.getWalletByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const wallet = await Wallet.findOne({ tripId })
      .populate('users.userId', 'firstName lastName email')
      .populate('transactions')
      .populate('expenses');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet',
      error: error.message,
    });
  }
};

// Add money to wallet
exports.addMoneyToWallet = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { amount, paymentMethod = 'cash' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Find user in wallet
    const userInWallet = wallet.users.find((u) => u.userId.toString() === req.userId);
    if (!userInWallet) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trip',
      });
    }

    // Update user balance
    userInWallet.balance += amount;
    wallet.totalBalance += amount;

    // Create transaction
    const transaction = new Transaction({
      walletId: wallet._id,
      tripId,
      userId: req.userId,
      type: 'credit',
      amount,
      paymentMethod,
      description: `Added Rs.${amount} to wallet`,
      status: 'completed',
      currency: wallet.currency,
    });

    await transaction.save();
    wallet.transactions.push(transaction._id);
    await wallet.save();

    res.json({
      success: true,
      message: 'Money added to wallet successfully',
      data: {
        userId: req.userId,
        amount,
        newBalance: userInWallet.balance,
        walletTotal: wallet.totalBalance,
        transaction: transaction._id,
      },
    });
  } catch (error) {
    console.error('Add money error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add money',
      error: error.message,
    });
  }
};

// Add expense to wallet/trip
exports.addExpense = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { amount, category, description, splitType = 'equal', splitBetween } = req.body;

    if (!amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Amount and category are required',
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Create expense
    const expense = new Expense({
      tripId,
      walletId: wallet._id,
      paidBy: req.userId,
      category,
      amount,
      currency: wallet.currency,
      description,
      splitType,
      splitBetween: splitBetween || trip.participants.map((p) => ({
        userId: p.userId,
        amount: amount / trip.participants.length,
      })),
    });

    await expense.save();

    // Update wallet expenses
    wallet.expenses.push(expense._id);
    await wallet.save();

    // Update trip budget
    const updatedTrip = await BudgetService.updateTripBudgetSpending(tripId);

    // Check for budget alerts
    const budgetStatus = await BudgetService.checkBudgetExceeded(tripId);
    if (budgetStatus.hasAlerts) {
      await BudgetService.createBudgetAlert(tripId, trip.owner, budgetStatus.alerts);
    }

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: {
        expense,
        tripBudget: {
          totalSpent: updatedTrip.Budget.spent,
          remaining: updatedTrip.Budget.remaining,
        },
        alerts: budgetStatus.alerts || [],
      },
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: error.message,
    });
  }
};

// Get user's share in trip
exports.getUserShare = async (req, res) => {
  try {
    const { tripId } = req.params;

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    const userInWallet = wallet.users.find((u) => u.userId.toString() === req.userId);
    if (!userInWallet) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trip',
      });
    }

    // Get all expenses for this user
    const expenses = await Expense.find({
      tripId,
      $or: [
        { paidBy: req.userId },
        { 'splitBetween.userId': req.userId },
      ],
    });

    const paid = expenses
      .filter((e) => e.paidBy.toString() === req.userId)
      .reduce((sum, e) => sum + e.amount, 0);

    const owes = expenses
      .filter((e) => e.splitBetween.some((s) => s.userId?.toString() === req.userId))
      .reduce((sum, e) => {
        const userShare = e.splitBetween.find((s) => s.userId?.toString() === req.userId);
        return sum + (userShare?.amount || 0);
      }, 0);

    const balance = paid - owes;

    res.json({
      success: true,
      data: {
        userId: req.userId,
        walletBalance: userInWallet.balance,
        totalPaid: paid,
        totalOwes: owes,
        balance,
        balanceStatus: balance > 0 ? 'will_receive' : balance < 0 ? 'will_pay' : 'settled',
      },
    });
  } catch (error) {
    console.error('Get user share error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user share',
      error: error.message,
    });
  }
};

// Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const { tripId } = req.params;

    const wallet = await Wallet.findOne({ tripId })
      .populate('users.userId', 'firstName lastName email');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Get user's balance in wallet
    const userInWallet = wallet.users.find((u) => u.userId?._id?.toString() === req.userId || u.userId?.toString() === req.userId);

    if (!userInWallet) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trip',
      });
    }

    // Get all expenses for this user to calculate net balance
    const expenses = await Expense.find({
      tripId,
      $or: [
        { paidBy: req.userId },
        { 'splitBetween.userId': req.userId },
      ],
    });

    const totalPaid = expenses
      .filter((e) => e.paidBy.toString() === req.userId)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalOwes = expenses
      .filter((e) => e.splitBetween.some((s) => s.userId?.toString() === req.userId))
      .reduce((sum, e) => {
        const userShare = e.splitBetween.find((s) => s.userId?.toString() === req.userId);
        return sum + (userShare?.amount || 0);
      }, 0);

    const netBalance = totalPaid - totalOwes;

    res.json({
      success: true,
      data: {
        tripId,
        userId: req.userId,
        walletBalance: userInWallet.balance,
        totalPaid,
        totalOwes,
        netBalance,
        currency: wallet.currency,
        tripTotalBalance: wallet.totalBalance,
        status: wallet.status,
      },
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: error.message,
    });
  }
};

// Get settlement details (who owes whom)
exports.getSettlementDetails = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId).populate('participants.userId', 'firstName lastName');
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Calculate balances for all participants
    const balances = {};

    for (const participant of trip.participants) {
      const userId = participant.userId?._id || participant.userId;
      const expenses = await Expense.find({
        tripId,
        $or: [{ paidBy: userId }, { 'splitBetween.userId': userId }],
      });

      const paid = expenses
        .filter((e) => e.paidBy.toString() === userId.toString())
        .reduce((sum, e) => sum + e.amount, 0);

      const owes = expenses
        .filter((e) => e.splitBetween.some((s) => s.userId?.toString() === userId.toString()))
        .reduce((sum, e) => {
          const userShare = e.splitBetween.find((s) => s.userId?.toString() === userId.toString());
          return sum + (userShare?.amount || 0);
        }, 0);

      balances[userId.toString()] = {
        userId,
        name: participant.userId ? participant.userId.firstName + ' ' + participant.userId.lastName : participant.name,
        paid,
        owes,
        balance: paid - owes,
      };
    }

    // Calculate settlements
    const settlements = [];
    const sorted = Object.values(balances).sort((a, b) => b.balance - a.balance);

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const payer = sorted[j];
        const receiver = sorted[i];

        if (payer.balance < 0 && receiver.balance > 0) {
          const settleAmount = Math.min(Math.abs(payer.balance), receiver.balance);
          settlements.push({
            from: payer.userId,
            fromName: payer.name,
            to: receiver.userId,
            toName: receiver.name,
            amount: settleAmount,
          });
          payer.balance += settleAmount;
          receiver.balance -= settleAmount;
        }
      }
    }

    res.json({
      success: true,
      data: {
        tripId,
        balances: Object.values(balances),
        settlements,
        totalExpenses: wallet.totalBalance,
      },
    });
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settlement details',
      error: error.message,
    });
  }
};

// Settle payment between users
exports.settlePayment = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { fromUserId, toUserId, amount } = req.body;

    if (!fromUserId || !toUserId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'FromUserId, toUserId, and valid amount are required',
      });
    }

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Create settlement transaction
    const transaction = new Transaction({
      walletId: wallet._id,
      tripId,
      userId: fromUserId,
      type: 'settlement',
      amount,
      description: `Settlement payment`,
      status: 'completed',
      currency: wallet.currency,
    });

    await transaction.save();
    wallet.transactions.push(transaction._id);

    // Add settlement to wallet
    if (!wallet.settlements) {
      wallet.settlements = [];
    }
    wallet.settlements.push({
      from: fromUserId,
      to: toUserId,
      amount,
      settled: true,
      settledAt: new Date(),
    });

    await wallet.save();

    res.json({
      success: true,
      message: 'Payment settled successfully',
      data: {
        from: fromUserId,
        to: toUserId,
        amount,
        transactionId: transaction._id,
        settledAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Settle payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle payment',
      error: error.message,
    });
  }
};

// Get wallet transactions
exports.getWalletTransactions = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    let query = { walletId: wallet._id };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email');

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message,
    });
  }
};

// Close wallet (finalize trip)
exports.closeWallet = async (req, res) => {
  try {
    const { tripId } = req.params;

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    wallet.status = 'closed';
    await wallet.save();

    res.json({
      success: true,
      message: 'Wallet closed successfully',
      data: wallet,
    });
  } catch (error) {
    console.error('Close wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close wallet',
      error: error.message,
    });
  }
};

// Get group wallet with all balances
exports.getGroupWalletBalances = async (req, res) => {
  try {
    const { tripId } = req.params;

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Calculate group balances using split service
    const groupBalances = await SplitService.calculateGroupBalances(tripId);

    // Calculate minimum settlements
    const settlements = SplitService.calculateMinimumSettlements(groupBalances);

    res.json({
      success: true,
      data: {
        tripId,
        walletStatus: wallet.status,
        currency: wallet.currency,
        totalPooled: wallet.totalBalance,
        groupBalances,
        settlements,
        summary: {
          totalParticipants: groupBalances.length,
          totalExpenses: groupBalances.reduce((sum, b) => sum + b.expenses.length, 0),
          totalSpent: groupBalances.reduce((sum, b) => sum + b.totalPaid, 0),
          unsettledCount: settlements.length,
        },
      },
    });
  } catch (error) {
    console.error('Get group wallet balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group wallet balances',
      error: error.message,
    });
  }
};

// Get per-user balance details
exports.getPerUserBalance = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.query.userId || req.userId;

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Verify user is part of trip
    const trip = await Trip.findById(tripId);
    const isParticipant = trip.participants.some((p) => p.userId.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'User is not part of this trip',
      });
    }

    // Get per-user balance using split service
    const userBalance = await SplitService.getPerUserBalance(tripId, userId);

    // Get user details
    const user = await User.findById(userId).select('firstName lastName email');

    res.json({
      success: true,
      data: {
        tripId,
        user: {
          userId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        ...userBalance,
      },
    });
  } catch (error) {
    console.error('Get per-user balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get per-user balance',
      error: error.message,
    });
  }
};

// Get group expense history with filtering
exports.getGroupExpenseHistory = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { category, dateFrom, dateTo, paidById, page = 1, limit = 20 } = req.query;

    const wallet = await Wallet.findOne({ tripId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Get expense history with filters
    const allExpenses = await SplitService.getGroupExpenseHistory(tripId, {
      category,
      dateFrom,
      dateTo,
      paidById,
    });

    // Pagination
    const startIdx = (parseInt(page) - 1) * parseInt(limit);
    const endIdx = startIdx + parseInt(limit);
    const paginatedExpenses = allExpenses.slice(startIdx, endIdx);

    const totalByCategory = {};
    let totalAmount = 0;

    allExpenses.forEach((exp) => {
      totalAmount += exp.amount;
      if (!totalByCategory[exp.category]) {
        totalByCategory[exp.category] = 0;
      }
      totalByCategory[exp.category] += exp.amount;
    });

    res.json({
      success: true,
      data: {
        tripId,
        expenses: paginatedExpenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allExpenses.length,
          pages: Math.ceil(allExpenses.length / parseInt(limit)),
        },
        summary: {
          totalExpenses: allExpenses.length,
          totalAmount,
          byCategory: totalByCategory,
          currency: wallet.currency,
        },
      },
    });
  } catch (error) {
    console.error('Get group expense history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense history',
      error: error.message,
    });
  }
};

// Calculate split for a new expense
exports.calculateExpenseSplit = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { amount, splitType = 'equal', participants, splits } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    if (!participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one participant is required',
      });
    }

    let calculatedSplit = [];

    try {
      if (splitType === 'equal') {
        calculatedSplit = SplitService.calculateEqualSplit(amount, participants);
      } else if (splitType === 'custom') {
        if (!splits || splits.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Splits are required for custom split type',
          });
        }
        const splitMode = splits[0].percentage ? 'percentage' : 'amount';
        calculatedSplit = SplitService.calculateCustomSplit(amount, splits, splitMode);
      } else if (splitType === 'itemwise') {
        if (!splits || splits.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Items are required for itemwise split',
          });
        }
        calculatedSplit = SplitService.calculateItemwiseSplit(splits);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Split calculation error: ${error.message}`,
      });
    }

    // Get user names
    const users = await User.find({ _id: { $in: calculatedSplit.map((s) => s.userId) } }).select(
      'firstName lastName'
    );

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id] = `${u.firstName} ${u.lastName}`;
    });

    res.json({
      success: true,
      data: {
        tripId,
        splitType,
        totalAmount: amount,
        splits: calculatedSplit.map((split) => ({
          userId: split.userId,
          userName: userMap[split.userId],
          amount: split.amount,
          percentage: parseFloat(((split.amount / amount) * 100).toFixed(2)),
        })),
        validation: {
          totalSplit: calculatedSplit.reduce((sum, s) => sum + s.amount, 0),
          isValid:
            Math.abs(calculatedSplit.reduce((sum, s) => sum + s.amount, 0) - amount) < 0.01,
        },
      },
    });
  } catch (error) {
    console.error('Calculate split error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate split',
      error: error.message,
    });
  }
};

// Get settlement suggestions
exports.getSettlementSuggestions = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Get group balances
    const groupBalances = await SplitService.calculateGroupBalances(tripId);

    // Calculate minimum settlements
    const settlements = SplitService.calculateMinimumSettlements(groupBalances);

    // Calculate total amount to be settled
    const totalToSettle = settlements.reduce((sum, s) => sum + s.amount, 0);

    res.json({
      success: true,
      data: {
        tripId,
        settlements,
        summary: {
          totalTransactions: settlements.length,
          totalToSettle,
          participantsWithDues: groupBalances.filter((b) => b.balance !== 0).length,
        },
      },
    });
  } catch (error) {
    console.error('Get settlement suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settlement suggestions',
      error: error.message,
    });
  }
};
