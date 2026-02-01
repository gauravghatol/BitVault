import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PaperAirplaneIcon,
  WalletIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import './SendTransaction.css';

function SendTransaction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedWallet = searchParams.get('wallet');

  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [txResult, setTxResult] = useState(null);

  const [formData, setFormData] = useState({
    fromWalletId: preselectedWallet || '',
    toAddress: '',
    amount: '',
    privateKey: '',
    description: '',
  });

  const [selectedWallet, setSelectedWallet] = useState(null);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await api.get('/wallets');
      console.log('Wallets API Response:', res.data);
      const walletsData = res.data.data?.wallets || res.data.data || [];
      console.log('Parsed wallets:', walletsData);
      setWallets(Array.isArray(walletsData) ? walletsData : []);
      
      // Auto-select if preselected wallet exists
      if (preselectedWallet) {
        setFormData(prev => ({ ...prev, fromWalletId: preselectedWallet }));
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      toast.error('Failed to load wallets');
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }, [preselectedWallet]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    if (formData.fromWalletId && wallets.length > 0) {
      const wallet = wallets.find(w => w._id === formData.fromWalletId);
      setSelectedWallet(wallet || null);
    } else {
      setSelectedWallet(null);
    }
  }, [formData.fromWalletId, wallets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fromWalletId) {
      toast.error('Please select a wallet');
      return;
    }

    if (!formData.toAddress) {
      toast.error('Please enter recipient address');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check if cold wallet requires private key
    if (selectedWallet?.storageType === 'cold' && !formData.privateKey) {
      toast.error('Private key is required for cold wallet transactions');
      return;
    }

    setSubmitting(true);

    try {
      // Convert BTC to satoshis (1 BTC = 100,000,000 satoshis)
      const amountInSatoshis = Math.floor(parseFloat(formData.amount) * 100000000);
      
      const payload = {
        walletId: formData.fromWalletId,
        toAddress: formData.toAddress,
        amount: amountInSatoshis,
        memo: formData.description || undefined,
      };

      // Only include private key for cold wallets
      if (selectedWallet?.storageType === 'cold') {
        payload.privateKey = formData.privateKey;
      }

      const res = await api.post('/transactions', payload);
      
      console.log('Transaction Response:', res.data);
      setTxResult(res.data.data.transaction);
      toast.success('Transaction sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBTC = (satoshis) => {
    return (satoshis / 100000000).toFixed(8);
  };

  if (loading) {
    return (
      <div className="send-transaction-page">
        <div className="send-loading">
          <div className="spinner-lg"></div>
          <p>Loading wallets...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (txResult) {
    return (
      <div className="send-transaction-page">
        <motion.div
          className="tx-success-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="tx-success-icon">
            <CheckCircleIcon />
          </div>
          <h2>Transaction Sent Successfully!</h2>
          
          <div className="tx-success-details">
            <div className="tx-detail-row">
              <span className="tx-detail-label">Transaction ID</span>
              <code className="tx-detail-value">{txResult.txId || 'N/A'}</code>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">Amount</span>
              <span className="tx-detail-value amount">
                -{formatBTC(txResult.amount || 0)} BTC
              </span>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">Network Fee</span>
              <span className="tx-detail-value">
                {formatBTC(txResult.fee || 0)} BTC
              </span>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">Recipient</span>
              <code className="tx-detail-value small">{txResult.toAddress || 'N/A'}</code>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">Status</span>
              <span className={`status-badge ${txResult.status || 'pending'}`}>
                {txResult.status || 'Pending'}
              </span>
            </div>
          </div>

          <div className="tx-success-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/wallets')}
            >
              Back to Wallets
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setTxResult(null);
                setFormData({
                  fromWalletId: '',
                  toAddress: '',
                  amount: '',
                  privateKey: '',
                  description: '',
                });
              }}
            >
              Send Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="send-transaction-page">
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeftIcon /> Back
      </button>

      <div className="send-header">
        <h1>Send Bitcoin</h1>
        <p>Transfer BTC to another address</p>
      </div>

      <div className="send-container">
        <motion.form
          className="send-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Wallet Selection */}
          <div className="form-section">
            <label className="form-label">
              <WalletIcon /> From Wallet
            </label>
            <select
              name="fromWalletId"
              value={formData.fromWalletId}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select a wallet</option>
              {wallets.map(wallet => (
                <option key={wallet._id} value={wallet._id}>
                  {wallet.name} - {formatBTC(wallet.balance)} BTC ({wallet.storageType})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Wallet Info */}
          <AnimatePresence>
            {selectedWallet && (
              <motion.div
                className={`wallet-info-banner ${selectedWallet.storageType}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="wallet-info-content">
                  <div className="wallet-info-left">
                    <span className={`storage-type-badge ${selectedWallet.storageType}`}>
                      {selectedWallet.storageType} Wallet
                    </span>
                    <span className="wallet-balance">
                      Available: {formatBTC(selectedWallet.balance)} BTC
                    </span>
                  </div>
                  {selectedWallet.storageType === 'cold' && (
                    <div className="cold-wallet-notice">
                      <ExclamationTriangleIcon />
                      <span>Private key required for signing</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recipient Address */}
          <div className="form-section">
            <label className="form-label">
              Recipient Address
            </label>
            <input
              type="text"
              name="toAddress"
              value={formData.toAddress}
              onChange={handleChange}
              placeholder="Enter Bitcoin address (e.g., 1BvBMSE...)"
              className="form-input"
              required
            />
          </div>

          {/* Amount */}
          <div className="form-section">
            <label className="form-label">
              Amount (BTC)
            </label>
            <div className="amount-input-wrapper">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00000000"
                step="0.00000001"
                min="0.00000001"
                className="form-input amount-input"
                required
              />
              <span className="amount-suffix">BTC</span>
            </div>
            {selectedWallet && formData.amount && (
              <div className="amount-info">
                <span className="usd-estimate">
                  ≈ ${(parseFloat(formData.amount || 0) * 43250).toLocaleString()} USD
                </span>
                {parseFloat(formData.amount) > formatBTC(selectedWallet.balance) && (
                  <span className="insufficient-funds">
                    <ExclamationTriangleIcon /> Insufficient funds
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cold Wallet Private Key */}
          <AnimatePresence>
            {selectedWallet?.storageType === 'cold' && (
              <motion.div
                className="form-section private-key-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="private-key-warning">
                  <ExclamationTriangleIcon />
                  <div>
                    <strong>Cold Wallet Transaction</strong>
                    <p>
                      This is a cold storage wallet. You must provide your private key
                      to sign this transaction. Your key is never stored and is only
                      used momentarily for signing.
                    </p>
                  </div>
                </div>
                
                <label className="form-label">
                  <KeyIcon /> Private Key (WIF Format)
                </label>
                <input
                  type="password"
                  name="privateKey"
                  value={formData.privateKey}
                  onChange={handleChange}
                  placeholder="Enter your private key..."
                  className="form-input private-key-input"
                  required={selectedWallet?.storageType === 'cold'}
                />
                <p className="form-hint">
                  <InformationCircleIcon />
                  Your private key was shown once when the wallet was created.
                  If you lost it, funds cannot be recovered.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Description */}
          <div className="form-section">
            <label className="form-label">
              Description (Optional)
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a note for this transaction"
              className="form-input"
            />
          </div>

          {/* Fee Estimate */}
          <div className="fee-estimate">
            <div className="fee-row">
              <span>Network Fee</span>
              <span>~0.00001000 BTC</span>
            </div>
            <div className="fee-row total">
              <span>Total</span>
              <span>
                {formData.amount
                  ? (parseFloat(formData.amount) + 0.00001).toFixed(8)
                  : '0.00000000'} BTC
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg send-btn"
            disabled={submitting || !selectedWallet}
          >
            {submitting ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              <>
                <PaperAirplaneIcon />
                Send Transaction
              </>
            )}
          </button>
        </motion.form>

        {/* Security Info Sidebar */}
        <div className="send-sidebar">
          <div className="security-info-card">
            <h3>Transaction Security</h3>
            
            <div className="security-item">
              <div className="security-icon hot">🔥</div>
              <div>
                <strong>Hot Wallet</strong>
                <p>Private key is encrypted and stored. Transactions are signed automatically.</p>
              </div>
            </div>

            <div className="security-item">
              <div className="security-icon cold">❄️</div>
              <div>
                <strong>Cold Wallet</strong>
                <p>Private key is never stored. You must provide it for each transaction (more secure).</p>
              </div>
            </div>

            <div className="security-item">
              <div className="security-icon">🔗</div>
              <div>
                <strong>Integrity Hash</strong>
                <p>All transactions are hashed to detect tampering.</p>
              </div>
            </div>
          </div>

          <div className="tips-card">
            <h3>💡 Tips</h3>
            <ul>
              <li>Double-check the recipient address</li>
              <li>Start with small test amounts</li>
              <li>Cold wallets are more secure for large holdings</li>
              <li>Transaction fees are simulated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SendTransaction;
