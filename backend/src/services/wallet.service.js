/**
 * Wallet Service
 * Handles all wallet-related business logic including:
 * - Wallet creation (hot and cold)
 * - Balance management
 * - Wallet retrieval and updates
 */

const { Wallet } = require('../models');
const cryptoService = require('./crypto.service');

class WalletService {
  /**
   * Create a new wallet
   * @param {Object} params - Wallet creation parameters
   * @param {string} params.userId - User ID
   * @param {string} params.name - Wallet name
   * @param {string} params.description - Wallet description
   * @param {string} params.storageType - 'hot' or 'cold'
   * @param {string} params.color - Wallet color for UI
   */
  async createWallet({ userId, name, description, storageType = 'hot', color }) {
    try {
      // Generate Bitcoin key pair
      const keyPair = cryptoService.generateKeyPair();
      
      // Prepare wallet data
      const walletData = {
        user: userId,
        name,
        description: description || '',
        publicAddress: keyPair.address,
        publicKey: keyPair.publicKey,
        storageType,
        network: keyPair.network,
        color: color || this.generateRandomColor(),
        balance: 100000000 // 1 BTC for demo purposes
        // integrityHash will be set by pre-save hook automatically
      };

      // For hot wallets, encrypt and store the private key
      if (storageType === 'hot') {
        const encrypted = cryptoService.encryptPrivateKey(keyPair.privateKey);
        walletData.encryptedPrivateKey = encrypted.encryptedData;
        walletData.encryptionMeta = {
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          algorithm: 'aes-256-gcm'
        };
      }

      // Create wallet in database
      const wallet = await Wallet.create(walletData);

      // Return wallet info (and private key for cold wallets - user must save it!)
      const response = {
        wallet: wallet.toJSON(),
        message: storageType === 'cold' 
          ? 'IMPORTANT: Save your private key securely. It will NEVER be shown again!'
          : 'Wallet created successfully. Private key is securely encrypted.'
      };

      // For cold wallets, return the private key ONCE
      if (storageType === 'cold') {
        response.privateKey = keyPair.privateKey;
        response.privateKeyWIF = keyPair.privateKeyWIF;
      }

      return response;
    } catch (error) {
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId, options = {}) {
    const { status = 'active', includeArchived = false } = options;

    const query = { user: userId };
    if (!includeArchived) {
      query.status = status;
    }

    const wallets = await Wallet.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return wallets.map(wallet => ({
      ...wallet,
      balanceBTC: wallet.balance / 100000000,
      pendingBalanceBTC: wallet.pendingBalance / 100000000,
      maskedAddress: this.maskAddress(wallet.publicAddress)
    }));
  }

  /**
   * Get a single wallet by ID
   */
  async getWalletById(walletId, userId) {
    const wallet = await Wallet.findOne({
      _id: walletId,
      user: userId
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  }

  /**
   * Get wallet by public address
   */
  async getWalletByAddress(address) {
    const wallet = await Wallet.findOne({ publicAddress: address });
    return wallet;
  }

  /**
   * Update wallet balance
   */
  async updateBalance(walletId, amount, operation = 'subtract') {
    const wallet = await Wallet.findById(walletId);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (operation === 'subtract') {
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }
      wallet.balance -= amount;
    } else if (operation === 'add') {
      wallet.balance += amount;
    }

    wallet.lastActivity = new Date();
    wallet.transactionCount += 1;
    
    await wallet.save();
    return wallet;
  }

  /**
   * Verify wallet integrity (tamper detection)
   */
  async verifyWalletIntegrity(walletId) {
    const wallet = await Wallet.findById(walletId);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const isValid = wallet.verifyIntegrity();
    
    return {
      walletId,
      isValid,
      message: isValid 
        ? 'Wallet data integrity verified' 
        : 'WARNING: Wallet data may have been tampered with!'
    };
  }

  /**
   * Get decrypted private key for hot wallet
   * This is used internally for transaction signing
   */
  async getPrivateKey(walletId, userId) {
    const wallet = await Wallet.findOne({
      _id: walletId,
      user: userId
    }).select('+encryptedPrivateKey');

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.storageType !== 'hot') {
      throw new Error('Cannot retrieve private key for cold wallet');
    }

    if (!wallet.encryptedPrivateKey) {
      throw new Error('Private key not available');
    }

    const privateKey = cryptoService.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.encryptionMeta.iv,
      wallet.encryptionMeta.authTag
    );

    return privateKey;
  }

  /**
   * Validate a private key for cold wallet transaction
   */
  validatePrivateKeyForWallet(privateKey, publicAddress) {
    return cryptoService.validateKeyPair(privateKey, publicAddress);
  }

  /**
   * Update wallet details
   */
  async updateWallet(walletId, userId, updates) {
    const allowedUpdates = ['name', 'description', 'color', 'tags', 'status'];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const wallet = await Wallet.findOneAndUpdate(
      { _id: walletId, user: userId },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  }

  /**
   * Archive a wallet (soft delete)
   */
  async archiveWallet(walletId, userId) {
    const wallet = await Wallet.findOneAndUpdate(
      { _id: walletId, user: userId },
      { $set: { status: 'archived' } },
      { new: true }
    );

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  }

  /**
   * Get wallet statistics for dashboard
   */
  async getWalletStats(userId) {
    const wallets = await Wallet.find({ user: userId, status: 'active' });

    const stats = {
      totalWallets: wallets.length,
      hotWallets: wallets.filter(w => w.storageType === 'hot').length,
      coldWallets: wallets.filter(w => w.storageType === 'cold').length,
      totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
      totalBalanceBTC: 0,
      totalTransactions: wallets.reduce((sum, w) => sum + w.transactionCount, 0)
    };

    stats.totalBalanceBTC = stats.totalBalance / 100000000;

    return stats;
  }

  /**
   * Helper: Mask address for display
   */
  maskAddress(address) {
    if (!address || address.length < 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }

  /**
   * Helper: Generate random color for wallet
   */
  generateRandomColor() {
    const colors = [
      '#F7931A', // Bitcoin orange
      '#627EEA', // Ethereum blue
      '#26A17B', // Tether green
      '#8247E5', // Polygon purple
      '#E84142', // Avalanche red
      '#2775CA', // Chainlink blue
      '#F0B90B', // Binance yellow
      '#00D395'  // Compound green
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

module.exports = new WalletService();
