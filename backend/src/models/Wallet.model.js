const mongoose = require('mongoose');
const crypto = require('crypto');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Wallet name is required'],
    trim: true,
    maxlength: [100, 'Wallet name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  // Bitcoin public address (safe to display)
  publicAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Public key in hex format
  publicKey: {
    type: String,
    required: true
  },
  // Storage type determines how private key is handled
  storageType: {
    type: String,
    enum: ['hot', 'cold'],
    required: true,
    default: 'hot'
  },
  // For HOT wallets only - encrypted private key
  // For COLD wallets, this is null (key never stored)
  encryptedPrivateKey: {
    type: String,
    default: null,
    select: false // Don't return by default for security
  },
  // Encryption metadata for hot wallets
  encryptionMeta: {
    iv: { type: String, default: null },
    authTag: { type: String, default: null },
    algorithm: { type: String, default: 'aes-256-gcm' }
  },
  // Simulated balance (in satoshis for precision)
  balance: {
    type: Number,
    default: 100000000, // Start with 1 BTC (100,000,000 satoshis) for demo
    min: [0, 'Balance cannot be negative']
  },
  // Pending balance (unconfirmed transactions)
  pendingBalance: {
    type: Number,
    default: 0
  },
  // Network type
  network: {
    type: String,
    enum: ['mainnet', 'testnet', 'regtest'],
    default: 'testnet'
  },
  // Wallet status
  status: {
    type: String,
    enum: ['active', 'frozen', 'archived'],
    default: 'active'
  },
  // Color for UI identification
  color: {
    type: String,
    default: '#F7931A' // Bitcoin orange
  },
  // Icon identifier
  icon: {
    type: String,
    default: 'bitcoin'
  },
  // Transaction count for quick access
  transactionCount: {
    type: Number,
    default: 0
  },
  // Last activity timestamp
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Integrity hash for tamper detection
  integrityHash: {
    type: String,
    default: ''
  },
  // Additional metadata
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  // Tags for organization
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for balance in BTC
walletSchema.virtual('balanceBTC').get(function() {
  return this.balance / 100000000;
});

// Virtual for pending balance in BTC
walletSchema.virtual('pendingBalanceBTC').get(function() {
  return this.pendingBalance / 100000000;
});

// Virtual for total balance (confirmed + pending)
walletSchema.virtual('totalBalance').get(function() {
  return this.balance + this.pendingBalance;
});

// Virtual for transactions
walletSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'wallet'
});

// Generate integrity hash for tamper detection
walletSchema.methods.generateIntegrityHash = function() {
  const dataToHash = JSON.stringify({
    publicAddress: this.publicAddress,
    publicKey: this.publicKey,
    balance: this.balance,
    storageType: this.storageType,
    createdAt: this.createdAt || new Date()
  });
  
  const secret = process.env.INTEGRITY_SECRET || process.env.ENCRYPTION_KEY;
  return crypto
    .createHash('sha256')
    .update(dataToHash + secret)
    .digest('hex');
};

// Verify wallet integrity
walletSchema.methods.verifyIntegrity = function() {
  const currentHash = this.generateIntegrityHash();
  return this.integrityHash === currentHash;
};

// Update integrity hash before saving
walletSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('balance') || this.isModified('publicAddress')) {
    this.integrityHash = this.generateIntegrityHash();
  }
  next();
});

// Check if wallet is hot storage
walletSchema.methods.isHotWallet = function() {
  return this.storageType === 'hot';
};

// Check if wallet is cold storage
walletSchema.methods.isColdWallet = function() {
  return this.storageType === 'cold';
};

// Get masked address for display
walletSchema.methods.getMaskedAddress = function() {
  if (!this.publicAddress) return '';
  return `${this.publicAddress.slice(0, 8)}...${this.publicAddress.slice(-8)}`;
};

// Indexes
// Note: publicAddress already has index: true in schema definition
walletSchema.index({ user: 1, status: 1 });
walletSchema.index({ createdAt: -1 });
walletSchema.index({ storageType: 1 });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
