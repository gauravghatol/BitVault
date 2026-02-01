const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema({
  // Reference to the wallet that initiated/received this transaction
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
    index: true
  },
  // User who owns the wallet
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Unique transaction ID (simulated txid)
  txId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Transaction type
  type: {
    type: String,
    enum: ['send', 'receive', 'internal'],
    required: true
  },
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Amount in satoshis
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least 1 satoshi']
  },
  // Transaction fee in satoshis
  fee: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative']
  },
  // Sender address
  fromAddress: {
    type: String,
    required: true
  },
  // Recipient address
  toAddress: {
    type: String,
    required: true
  },
  // Balance after this transaction
  balanceAfter: {
    type: Number,
    required: true
  },
  // Number of confirmations (simulated)
  confirmations: {
    type: Number,
    default: 0,
    min: 0
  },
  // Block number (simulated)
  blockNumber: {
    type: Number,
    default: null
  },
  // Block hash (simulated)
  blockHash: {
    type: String,
    default: null
  },
  // Memo/description
  memo: {
    type: String,
    trim: true,
    maxlength: [500, 'Memo cannot exceed 500 characters'],
    default: ''
  },
  // Storage type used for signing
  signingMethod: {
    type: String,
    enum: ['hot', 'cold'],
    required: true
  },
  // Signature (hex encoded)
  signature: {
    type: String,
    default: null
  },
  // Raw transaction data (for verification)
  rawTransaction: {
    type: String,
    default: null
  },
  // Integrity hash for tamper detection
  integrityHash: {
    type: String,
    default: ''
  },
  // Previous transaction hash (for chain verification)
  previousTxHash: {
    type: String,
    default: null
  },
  // IP address of the requester (for security audit)
  ipAddress: {
    type: String,
    default: null
  },
  // User agent
  userAgent: {
    type: String,
    default: null
  },
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Timestamps for confirmation
  confirmedAt: {
    type: Date,
    default: null
  },
  // Error message if failed
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for amount in BTC
transactionSchema.virtual('amountBTC').get(function() {
  return this.amount / 100000000;
});

// Virtual for fee in BTC
transactionSchema.virtual('feeBTC').get(function() {
  return this.fee / 100000000;
});

// Virtual for total amount (amount + fee)
transactionSchema.virtual('totalAmount').get(function() {
  return this.amount + this.fee;
});

// Virtual for masked from address
transactionSchema.virtual('maskedFromAddress').get(function() {
  if (!this.fromAddress) return '';
  return `${this.fromAddress.slice(0, 8)}...${this.fromAddress.slice(-8)}`;
});

// Virtual for masked to address
transactionSchema.virtual('maskedToAddress').get(function() {
  if (!this.toAddress) return '';
  return `${this.toAddress.slice(0, 8)}...${this.toAddress.slice(-8)}`;
});

// Generate unique transaction ID
transactionSchema.statics.generateTxId = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Generate integrity hash
transactionSchema.methods.generateIntegrityHash = function() {
  const dataToHash = JSON.stringify({
    txId: this.txId,
    type: this.type,
    amount: this.amount,
    fee: this.fee,
    fromAddress: this.fromAddress,
    toAddress: this.toAddress,
    balanceAfter: this.balanceAfter,
    previousTxHash: this.previousTxHash,
    createdAt: this.createdAt?.toISOString() || new Date().toISOString()
  });
  
  return crypto
    .createHash('sha256')
    .update(dataToHash + process.env.ENCRYPTION_KEY)
    .digest('hex');
};

// Verify transaction integrity
transactionSchema.methods.verifyIntegrity = function() {
  const currentHash = this.generateIntegrityHash();
  return this.integrityHash === currentHash;
};

// Generate chain hash (links transactions together)
transactionSchema.statics.generateChainHash = async function(walletId) {
  const lastTx = await this.findOne({ wallet: walletId })
    .sort({ createdAt: -1 })
    .select('integrityHash');
  
  return lastTx ? lastTx.integrityHash : null;
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.integrityHash = this.generateIntegrityHash();
  }
  next();
});

// Simulate confirmation (increment confirmations)
transactionSchema.methods.simulateConfirmation = async function() {
  if (this.confirmations < 6) {
    this.confirmations += 1;
    if (this.confirmations >= 1 && this.status === 'pending') {
      this.status = 'confirmed';
      this.confirmedAt = new Date();
    }
    await this.save();
  }
  return this;
};

// Mark as failed
transactionSchema.methods.markAsFailed = async function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  await this.save();
  return this;
};

// Indexes for efficient querying
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });
// Note: txHash already has unique: true which creates an index
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ fromAddress: 1 });
transactionSchema.index({ toAddress: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
