/**
 * Transaction Controller
 * Handles transaction creation, history, and verification
 */

const { transactionService } = require('../services');

/**
 * @desc    Create new transaction (send coins)
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res, next) => {
  try {
    const { walletId, toAddress, amount, memo, privateKey } = req.body;

    const result = await transactionService.createTransaction({
      userId: req.user.id,
      walletId,
      toAddress,
      amount: parseInt(amount),
      memo,
      privateKey, // Required for cold wallet transactions
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        transaction: result.transaction,
        newBalance: result.newBalance,
        newBalanceBTC: result.newBalanceBTC
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transactions for a wallet
 * @route   GET /api/transactions/wallet/:walletId
 * @access  Private
 */
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { page, limit, type, status } = req.query;

    const result = await transactionService.getWalletTransactions(
      walletId,
      req.user.id,
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        type,
        status
      }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions for user
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getUserTransactions = async (req, res, next) => {
  try {
    const { page, limit, type } = req.query;

    const result = await transactionService.getUserTransactions(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/transactions/:txId
 * @access  Private
 */
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(
      req.params.txId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify transaction integrity
 * @route   GET /api/transactions/:txId/verify
 * @access  Private
 */
exports.verifyTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.verifyTransactionIntegrity(
      req.params.txId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify entire transaction chain for a wallet
 * @route   GET /api/transactions/wallet/:walletId/verify-chain
 * @access  Private
 */
exports.verifyTransactionChain = async (req, res, next) => {
  try {
    const result = await transactionService.verifyTransactionChain(
      req.params.walletId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction statistics
 * @route   GET /api/transactions/stats
 * @access  Private
 */
exports.getTransactionStats = async (req, res, next) => {
  try {
    const stats = await transactionService.getTransactionStats(req.user.id);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Estimate transaction fee
 * @route   GET /api/transactions/estimate-fee
 * @access  Private
 */
exports.estimateFee = async (req, res, next) => {
  try {
    const { priority = 'medium' } = req.query;
    const feeEstimate = transactionService.estimateFee(priority);

    res.status(200).json({
      success: true,
      data: { feeEstimate }
    });
  } catch (error) {
    next(error);
  }
};
