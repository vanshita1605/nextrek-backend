// src/services/splitService.js
const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

/**
 * Split calculation logic for expenses
 */
class SplitService {
  /**
   * Calculate equal split
   * @param {Number} amount - Total expense amount
   * @param {Array} participants - Array of user IDs
   * @returns {Array} Array of {userId, amount} with split amount
   */
  static calculateEqualSplit(amount, participants) {
    const perPerson = amount / participants.length;
    return participants.map((userId) => ({
      userId,
      amount: parseFloat(perPerson.toFixed(2)),
    }));
  }

  /**
   * Calculate custom split
   * @param {Number} amount - Total expense amount
   * @param {Array} splits - Array of {userId, percentage or amount}
   * @param {String} splitMode - 'percentage' or 'amount'
   * @returns {Array} Array of {userId, amount}
   */
  static calculateCustomSplit(amount, splits, splitMode = 'percentage') {
    if (splitMode === 'percentage') {
      const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
      if (totalPercentage !== 100) {
        throw new Error('Percentages must sum to 100');
      }
      return splits.map((split) => ({
        userId: split.userId,
        amount: parseFloat(((amount * split.percentage) / 100).toFixed(2)),
      }));
    } else {
      // Amount mode
      const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(totalAmount - amount) > 0.01) {
        throw new Error('Split amounts must equal total amount');
      }
      return splits.map((split) => ({
        userId: split.userId,
        amount: parseFloat(split.amount.toFixed(2)),
      }));
    }
  }

  /**
   * Calculate itemwise split
   * @param {Array} items - Array of {itemName, amount, splitBetween: [userId]}
   * @returns {Array} Array of {userId, amount}
   */
  static calculateItemwiseSplit(items) {
    const result = {};

    items.forEach((item) => {
      const perPerson = item.amount / item.splitBetween.length;
      item.splitBetween.forEach((userId) => {
        if (!result[userId.toString()]) {
          result[userId.toString()] = 0;
        }
        result[userId.toString()] += perPerson;
      });
    });

    return Object.entries(result).map(([userId, amount]) => ({
      userId,
      amount: parseFloat(amount.toFixed(2)),
    }));
  }

  /**
   * Get all expenses and calculate balances for a trip
   * @param {String} tripId - Trip ID
   * @returns {Object} Balance details for all participants
   */
  static async calculateGroupBalances(tripId) {
    const expenses = await Expense.find({ tripId, status: { $ne: 'cancelled' } })
      .populate('paidBy', '_id firstName lastName email')
      .populate('splitBetween.userId', '_id firstName lastName email');

    const balances = {};
    const transactionsByUser = {};

    // Initialize balances
    expenses.forEach((expense) => {
      if (!balances[expense.paidBy._id]) {
        balances[expense.paidBy._id] = {
          userId: expense.paidBy._id,
          name: `${expense.paidBy.firstName} ${expense.paidBy.lastName}`,
          email: expense.paidBy.email,
          totalPaid: 0,
          totalOwes: 0,
          expenses: [],
          owedBy: {},
        };
      }

      expense.splitBetween.forEach((split) => {
        if (!balances[split.userId]) {
          balances[split.userId] = {
            userId: split.userId,
            name: `${split.userId.firstName} ${split.userId.lastName}`,
            email: split.userId.email,
            totalPaid: 0,
            totalOwes: 0,
            expenses: [],
            owedBy: {},
          };
        }
      });
    });

    // Calculate who paid what and who owes what
    expenses.forEach((expense) => {
      balances[expense.paidBy._id].totalPaid += expense.amount;
      balances[expense.paidBy._id].expenses.push({
        expenseId: expense._id,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        paidFor: expense.splitBetween.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      });

      expense.splitBetween.forEach((split) => {
        balances[split.userId].totalOwes += split.amount;

        if (!balances[split.userId].owedBy[expense.paidBy._id]) {
          balances[split.userId].owedBy[expense.paidBy._id] = {
            name: `${expense.paidBy.firstName} ${expense.paidBy.lastName}`,
            amount: 0,
          };
        }
        balances[split.userId].owedBy[expense.paidBy._id].amount += split.amount;
      });
    });

    // Calculate net balances
    Object.values(balances).forEach((balance) => {
      balance.balance = balance.totalPaid - balance.totalOwes;
    });

    return Object.values(balances);
  }

  /**
   * Get per-user balance details
   * @param {String} tripId - Trip ID
   * @param {String} userId - User ID
   * @returns {Object} User's balance details
   */
  static async getPerUserBalance(tripId, userId) {
    const expenses = await Expense.find({
      tripId,
      status: { $ne: 'cancelled' },
      $or: [{ paidBy: userId }, { 'splitBetween.userId': userId }],
    })
      .populate('paidBy', '_id firstName lastName email')
      .populate('splitBetween.userId', '_id firstName lastName email');

    let totalPaid = 0;
    let totalOwes = 0;
    const breakdown = [];
    const owedTo = {};
    const owedBy = {};

    expenses.forEach((expense) => {
      if (expense.paidBy._id.toString() === userId.toString()) {
        totalPaid += expense.amount;
        breakdown.push({
          type: 'paid',
          expenseId: expense._id,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          paidFor: expense.splitBetween.length,
        });

        expense.splitBetween.forEach((split) => {
          if (split.userId._id.toString() !== userId.toString()) {
            const person = `${split.userId.firstName} ${split.userId.lastName}`;
            if (!owedBy[split.userId._id]) {
              owedBy[split.userId._id] = {
                name: person,
                email: split.userId.email,
                amount: 0,
              };
            }
            owedBy[split.userId._id].amount += split.amount;
          }
        });
      } else {
        const userSplit = expense.splitBetween.find(
          (s) => s.userId._id.toString() === userId.toString()
        );
        if (userSplit) {
          totalOwes += userSplit.amount;
          breakdown.push({
            type: 'owed',
            expenseId: expense._id,
            amount: userSplit.amount,
            category: expense.category,
            description: expense.description,
            date: expense.date,
            paidBy: `${expense.paidBy.firstName} ${expense.paidBy.lastName}`,
            paidById: expense.paidBy._id,
          });

          const person = `${expense.paidBy.firstName} ${expense.paidBy.lastName}`;
          if (!owedTo[expense.paidBy._id]) {
            owedTo[expense.paidBy._id] = {
              name: person,
              email: expense.paidBy.email,
              amount: 0,
            };
          }
          owedTo[expense.paidBy._id].amount += userSplit.amount;
        }
      }
    });

    const netBalance = totalPaid - totalOwes;

    return {
      userId,
      totalPaid,
      totalOwes,
      netBalance,
      balanceStatus: netBalance > 0 ? 'will_receive' : netBalance < 0 ? 'will_pay' : 'settled',
      breakdown,
      owedTo: Object.values(owedTo),
      owedBy: Object.values(owedBy),
      expenseCount: expenses.length,
    };
  }

  /**
   * Calculate minimum transactions needed to settle all debts
   * @param {Array} balances - Array of balance objects
   * @returns {Array} Array of settlement transactions
   */
  static calculateMinimumSettlements(balances) {
    const debtors = [];
    const creditors = [];

    balances.forEach((balance) => {
      if (balance.balance < 0) {
        debtors.push({
          name: balance.name,
          userId: balance.userId,
          amount: Math.abs(balance.balance),
        });
      } else if (balance.balance > 0) {
        creditors.push({
          name: balance.name,
          userId: balance.userId,
          amount: balance.balance,
        });
      }
    });

    const settlements = [];
    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];
      const amount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: parseFloat(amount.toFixed(2)),
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount === 0) debtorIdx++;
      if (creditor.amount === 0) creditorIdx++;
    }

    return settlements;
  }

  /**
   * Validate split
   * @param {Object} split - Split object
   * @param {Number} totalAmount - Total amount
   * @param {String} splitType - Split type
   * @returns {Boolean} Is valid
   */
  static validateSplit(split, totalAmount, splitType) {
    if (!split || !split.length) {
      return false;
    }

    if (splitType === 'percentage') {
      const total = split.reduce((sum, s) => sum + (s.percentage || 0), 0);
      return total === 100;
    } else if (splitType === 'amount') {
      const total = split.reduce((sum, s) => sum + (s.amount || 0), 0);
      return Math.abs(total - totalAmount) < 0.01;
    }

    return true;
  }

  /**
   * Get expense history for a group
   * @param {String} tripId - Trip ID
   * @param {Object} filters - Filter options (category, dateFrom, dateTo, etc)
   * @returns {Array} Filtered expenses
   */
  static async getGroupExpenseHistory(tripId, filters = {}) {
    let query = { tripId, status: { $ne: 'cancelled' } };

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) {
        query.date.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.date.$lte = new Date(filters.dateTo);
      }
    }

    if (filters.paidById) {
      query.paidBy = filters.paidById;
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', '_id firstName lastName email')
      .populate('splitBetween.userId', '_id firstName lastName email')
      .sort({ date: -1 });

    return expenses.map((exp) => ({
      _id: exp._id,
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      date: exp.date,
      currency: exp.currency,
      paidBy: `${exp.paidBy.firstName} ${exp.paidBy.lastName}`,
      paidById: exp.paidBy._id,
      splitType: exp.splitType,
      splitCount: exp.splitBetween.length,
      splits: exp.splitBetween.map((s) => ({
        name: `${s.userId.firstName} ${s.userId.lastName}`,
        userId: s.userId._id,
        amount: s.amount,
      })),
      tags: exp.tags,
      location: exp.location,
    }));
  }
}

module.exports = SplitService;
