/**
 * Dashboard Controller
 * Provides aggregated data for the dashboard view
 */

const { walletService, transactionService } = require('../services');
const { Transaction } = require('../models');

/**
 * @desc    Get dashboard overview data
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    // Get wallet statistics
    const walletStats = await walletService.getWalletStats(req.user.id);
    
    // Get transaction statistics
    const txStats = await transactionService.getTransactionStats(req.user.id);

    // Get recent transactions (last 5)
    const recentTxResult = await transactionService.getUserTransactions(req.user.id, {
      page: 1,
      limit: 5
    });

    // Get all wallets for quick overview
    const wallets = await walletService.getUserWallets(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalBalance: walletStats.totalBalance,
          totalBalanceBTC: walletStats.totalBalanceBTC,
          totalWallets: walletStats.totalWallets,
          hotWallets: walletStats.hotWallets,
          coldWallets: walletStats.coldWallets,
          totalTransactions: txStats.totalTransactions
        },
        transactionSummary: {
          totalSent: txStats.totalSent,
          totalSentBTC: txStats.totalSentBTC,
          totalReceived: txStats.totalReceived,
          totalReceivedBTC: txStats.totalReceivedBTC,
          totalFees: txStats.totalFees,
          totalFeesBTC: txStats.totalFeesBTC,
          pendingCount: txStats.pendingCount,
          confirmedCount: txStats.confirmedCount
        },
        recentTransactions: recentTxResult.transactions,
        wallets: wallets.slice(0, 5) // Top 5 wallets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get activity chart data
 * @route   GET /api/dashboard/activity
 * @access  Private
 */
exports.getActivityData = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Aggregate transactions by day
    const activity = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          sent: {
            $sum: { $cond: [{ $eq: ['$type', 'send'] }, '$amount', 0] }
          },
          received: {
            $sum: { $cond: [{ $eq: ['$type', 'receive'] }, '$amount', 0] }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get security status
 * @route   GET /api/dashboard/security
 * @access  Private
 */
exports.getSecurityStatus = async (req, res, next) => {
  try {
    const wallets = await walletService.getUserWallets(req.user.id);
    
    // Check integrity of all wallets
    const integrityResults = [];
    let allValid = true;

    for (const wallet of wallets) {
      const result = await walletService.verifyWalletIntegrity(wallet._id);
      integrityResults.push({
        walletId: wallet._id,
        walletName: wallet.name,
        isValid: result.isValid
      });
      if (!result.isValid) allValid = false;
    }

    res.status(200).json({
      success: true,
      data: {
        overallStatus: allValid ? 'secure' : 'warning',
        walletsChecked: wallets.length,
        integrityResults,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
