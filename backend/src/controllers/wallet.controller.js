/**
 * Wallet Controller
 * Handles wallet creation, retrieval, and management
 */

const { walletService } = require('../services');

/**
 * @desc    Create new wallet
 * @route   POST /api/wallets
 * @access  Private
 */
exports.createWallet = async (req, res, next) => {
  try {
    const { name, description, storageType, color } = req.body;

    const result = await walletService.createWallet({
      userId: req.user.id,
      name,
      description,
      storageType,
      color
    });

    // For cold wallets, this is the ONLY time the private key is shown
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        wallet: result.wallet,
        // Only included for cold wallets
        ...(storageType === 'cold' && {
          privateKey: result.privateKey,
          privateKeyWIF: result.privateKeyWIF,
          warning: 'SAVE THIS PRIVATE KEY NOW! It will NEVER be shown again.'
        })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all wallets for user
 * @route   GET /api/wallets
 * @access  Private
 */
exports.getWallets = async (req, res, next) => {
  try {
    const { includeArchived } = req.query;

    const wallets = await walletService.getUserWallets(req.user.id, {
      includeArchived: includeArchived === 'true'
    });

    res.status(200).json({
      success: true,
      count: wallets.length,
      data: { wallets }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single wallet by ID
 * @route   GET /api/wallets/:id
 * @access  Private
 */
exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWalletById(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          ...wallet.toJSON(),
          balanceBTC: wallet.balance / 100000000,
          maskedAddress: wallet.getMaskedAddress()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update wallet
 * @route   PUT /api/wallets/:id
 * @access  Private
 */
exports.updateWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.updateWallet(
      req.params.id,
      req.user.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Wallet updated successfully',
      data: { wallet }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Archive wallet
 * @route   DELETE /api/wallets/:id
 * @access  Private
 */
exports.archiveWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.archiveWallet(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Wallet archived successfully',
      data: { wallet }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify wallet integrity
 * @route   GET /api/wallets/:id/verify
 * @access  Private
 */
exports.verifyWallet = async (req, res, next) => {
  try {
    const result = await walletService.verifyWalletIntegrity(req.params.id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get wallet statistics
 * @route   GET /api/wallets/stats
 * @access  Private
 */
exports.getWalletStats = async (req, res, next) => {
  try {
    const stats = await walletService.getWalletStats(req.user.id);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};
