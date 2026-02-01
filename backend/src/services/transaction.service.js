/**
 * Transaction Service
 * Handles all transaction-related business logic including:
 * - Transaction creation and processing
 * - Balance verification and updates
 * - Transaction history
 * - Integrity verification
 */

const { Transaction, Wallet } = require('../models');
const cryptoService = require('./crypto.service');
const walletService = require('./wallet.service');

class TransactionService {
  /**
   * Create and process a transaction
   * @param {Object} params - Transaction parameters
   */
  async createTransaction({
    userId,
    walletId,
    toAddress,
    amount, // in satoshis
    memo = '',
    privateKey = null, // Required for cold wallets
    ipAddress = null,
    userAgent = null
  }) {
    // Get sender wallet
    const senderWallet = await Wallet.findOne({
      _id: walletId,
      user: userId,
      status: 'active'
    }).select('+encryptedPrivateKey');

    if (!senderWallet) {
      throw new Error('Sender wallet not found');
    }

    // Validate recipient address
    if (!cryptoService.validateAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    // Prevent sending to self
    if (senderWallet.publicAddress === toAddress) {
      throw new Error('Cannot send to the same address');
    }

    // Calculate fee (simulated - 0.0001 BTC = 10000 satoshis)
    const fee = 10000;
    const totalAmount = amount + fee;

    // Check balance
    if (senderWallet.balance < totalAmount) {
      throw new Error(`Insufficient balance. Available: ${senderWallet.balance} satoshis, Required: ${totalAmount} satoshis`);
    }

    // Get private key based on storage type
    let signingKey;
    if (senderWallet.storageType === 'hot') {
      // Decrypt private key from storage
      signingKey = cryptoService.decryptPrivateKey(
        senderWallet.encryptedPrivateKey,
        senderWallet.encryptionMeta.iv,
        senderWallet.encryptionMeta.authTag
      );
    } else {
      // Cold wallet - private key must be provided by user
      if (!privateKey) {
        throw new Error('Private key required for cold wallet transaction');
      }
      
      // Validate the provided private key
      if (!walletService.validatePrivateKeyForWallet(privateKey, senderWallet.publicAddress)) {
        throw new Error('Invalid private key for this wallet');
      }
      
      signingKey = privateKey;
    }

    // Generate transaction ID
    const txId = Transaction.generateTxId();

    // Get previous transaction hash for chain linking
    const previousTxHash = await Transaction.generateChainHash(walletId);

    // Prepare transaction data for signing
    const transactionData = {
      txId,
      fromAddress: senderWallet.publicAddress,
      toAddress,
      amount,
      fee,
      timestamp: Date.now(),
      previousTxHash
    };

    // Sign the transaction
    const signatureResult = cryptoService.signTransaction(signingKey, transactionData);

    // Calculate new balance
    const newBalance = senderWallet.balance - totalAmount;

    // Create the transaction record
    const transaction = await Transaction.create({
      wallet: walletId,
      user: userId,
      txId,
      type: 'send',
      status: 'confirmed', // Simulated instant confirmation
      amount,
      fee,
      fromAddress: senderWallet.publicAddress,
      toAddress,
      balanceAfter: newBalance,
      confirmations: 6, // Simulated full confirmation
      blockNumber: Math.floor(Math.random() * 1000000) + 800000,
      blockHash: cryptoService.generateRandomBytes(32),
      memo,
      signingMethod: senderWallet.storageType,
      signature: signatureResult.signature,
      previousTxHash,
      ipAddress,
      userAgent,
      confirmedAt: new Date(),
      integrityHash: '' // Will be set by pre-save hook
    });

    // Update sender wallet balance
    await walletService.updateBalance(walletId, totalAmount, 'subtract');

    // Check if recipient wallet exists in our system
    const recipientWallet = await walletService.getWalletByAddress(toAddress);
    
    if (recipientWallet) {
      // Create receive transaction for recipient
      await Transaction.create({
        wallet: recipientWallet._id,
        user: recipientWallet.user,
        txId: `${txId}-receive`,
        type: 'receive',
        status: 'confirmed',
        amount,
        fee: 0,
        fromAddress: senderWallet.publicAddress,
        toAddress,
        balanceAfter: recipientWallet.balance + amount,
        confirmations: 6,
        blockNumber: transaction.blockNumber,
        blockHash: transaction.blockHash,
        memo: `Received from ${senderWallet.publicAddress.slice(0, 8)}...`,
        signingMethod: senderWallet.storageType,
        previousTxHash: await Transaction.generateChainHash(recipientWallet._id),
        confirmedAt: new Date(),
        integrityHash: ''
      });

      // Update recipient balance
      await walletService.updateBalance(recipientWallet._id, amount, 'add');
    }

    return {
      transaction: transaction.toJSON(),
      message: 'Transaction completed successfully',
      newBalance,
      newBalanceBTC: newBalance / 100000000
    };
  }

  /**
   * Get transaction history for a wallet
   */
  async getWalletTransactions(walletId, userId, options = {}) {
    const { page = 1, limit = 20, type = null, status = null } = options;

    // Verify wallet ownership
    const wallet = await Wallet.findOne({ _id: walletId, user: userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const query = { wallet: walletId };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Transaction.countDocuments(query);

    return {
      transactions: transactions.map(tx => ({
        ...tx,
        amountBTC: tx.amount / 100000000,
        feeBTC: tx.fee / 100000000
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get all transactions for a user
   */
  async getUserTransactions(userId, options = {}) {
    const { page = 1, limit = 20, type = null } = options;

    const query = { user: userId };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('wallet', 'name publicAddress color')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Transaction.countDocuments(query);

    return {
      transactions: transactions.map(tx => ({
        ...tx,
        amountBTC: tx.amount / 100000000,
        feeBTC: tx.fee / 100000000
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(txId, userId) {
    const transaction = await Transaction.findOne({ txId, user: userId })
      .populate('wallet', 'name publicAddress color storageType');

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  /**
   * Verify transaction integrity
   */
  async verifyTransactionIntegrity(txId, userId) {
    const transaction = await Transaction.findOne({ txId, user: userId });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const isValid = transaction.verifyIntegrity();

    return {
      txId,
      isValid,
      message: isValid
        ? 'Transaction data integrity verified'
        : 'WARNING: Transaction data may have been tampered with!'
    };
  }

  /**
   * Verify entire transaction chain for a wallet
   */
  async verifyTransactionChain(walletId, userId) {
    // Verify wallet ownership
    const wallet = await Wallet.findOne({ _id: walletId, user: userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const transactions = await Transaction.find({ wallet: walletId })
      .sort({ createdAt: 1 })
      .lean();

    const results = [];
    let previousHash = null;
    let chainValid = true;

    for (const tx of transactions) {
      const transaction = new Transaction(tx);
      const integrityValid = transaction.verifyIntegrity();
      const chainLinkValid = previousHash === null || tx.previousTxHash === previousHash;

      if (!integrityValid || !chainLinkValid) {
        chainValid = false;
      }

      results.push({
        txId: tx.txId,
        integrityValid,
        chainLinkValid,
        createdAt: tx.createdAt
      });

      previousHash = tx.integrityHash;
    }

    return {
      walletId,
      totalTransactions: transactions.length,
      chainValid,
      results,
      message: chainValid
        ? 'All transactions verified. Chain integrity intact.'
        : 'WARNING: Transaction chain integrity compromised!'
    };
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(userId) {
    const transactions = await Transaction.find({ user: userId });

    const stats = {
      totalTransactions: transactions.length,
      totalSent: 0,
      totalReceived: 0,
      totalFees: 0,
      pendingCount: 0,
      confirmedCount: 0,
      failedCount: 0
    };

    for (const tx of transactions) {
      if (tx.type === 'send') {
        stats.totalSent += tx.amount;
        stats.totalFees += tx.fee;
      } else if (tx.type === 'receive') {
        stats.totalReceived += tx.amount;
      }

      if (tx.status === 'pending') stats.pendingCount++;
      if (tx.status === 'confirmed') stats.confirmedCount++;
      if (tx.status === 'failed') stats.failedCount++;
    }

    stats.totalSentBTC = stats.totalSent / 100000000;
    stats.totalReceivedBTC = stats.totalReceived / 100000000;
    stats.totalFeesBTC = stats.totalFees / 100000000;

    return stats;
  }

  /**
   * Estimate transaction fee
   */
  estimateFee(priority = 'medium') {
    // Simulated fee estimation (in satoshis)
    const fees = {
      low: 5000,      // ~0.00005 BTC
      medium: 10000,  // ~0.0001 BTC
      high: 20000     // ~0.0002 BTC
    };

    return {
      fee: fees[priority] || fees.medium,
      feeBTC: (fees[priority] || fees.medium) / 100000000,
      priority,
      estimatedTime: priority === 'low' ? '~60 min' : priority === 'high' ? '~10 min' : '~30 min'
    };
  }
}

module.exports = new TransactionService();
