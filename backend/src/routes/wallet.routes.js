/**
 * Wallet Routes
 */

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth.middleware');
const { walletValidation } = require('../middleware/validation.middleware');

// All wallet routes require authentication
router.use(protect);

// Statistics route (must be before :id routes)
router.get('/stats', walletController.getWalletStats);

// CRUD operations
router.route('/')
  .get(walletController.getWallets)
  .post(walletValidation.create, walletController.createWallet);

router.route('/:id')
  .get(walletValidation.getById, walletController.getWallet)
  .put(walletValidation.update, walletController.updateWallet)
  .delete(walletValidation.getById, walletController.archiveWallet);

// Integrity verification
router.get('/:id/verify', walletValidation.getById, walletController.verifyWallet);

module.exports = router;
