/**
 * Transaction Routes
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { transactionValidation } = require('../middleware/validation.middleware');

// All transaction routes require authentication
router.use(protect);

// Statistics and fee estimation (must be before :txId routes)
router.get('/stats', transactionController.getTransactionStats);
router.get('/estimate-fee', transactionController.estimateFee);

// Get all user transactions
router.get('/', transactionValidation.list, transactionController.getUserTransactions);

// Create new transaction
router.post('/', transactionValidation.create, transactionController.createTransaction);

// Get transactions for specific wallet
router.get('/wallet/:walletId', transactionController.getWalletTransactions);

// Verify transaction chain for wallet
router.get('/wallet/:walletId/verify-chain', transactionController.verifyTransactionChain);

// Single transaction operations
router.get('/:txId', transactionValidation.getById, transactionController.getTransaction);
router.get('/:txId/verify', transactionValidation.getById, transactionController.verifyTransaction);

module.exports = router;
