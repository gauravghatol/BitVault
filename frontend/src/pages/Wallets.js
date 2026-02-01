import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { walletAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  WalletIcon,
  FireIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ClipboardIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import './Wallets.css';

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWalletResult, setNewWalletResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    storageType: 'hot'
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await walletAPI.getAll();
      const walletsData = response.data.data.wallets || response.data.data || [];
      setWallets(Array.isArray(walletsData) ? walletsData : []);
    } catch (error) {
      toast.error('Failed to fetch wallets');
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await walletAPI.create(formData);
      const result = response.data.data;
      
      if (formData.storageType === 'cold') {
        // Show private key for cold wallet
        setNewWalletResult(result);
      } else {
        toast.success('Hot wallet created successfully!');
        setShowModal(false);
        fetchWallets();
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create wallet');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPrivateKey = () => {
    navigator.clipboard.writeText(newWalletResult.privateKey);
    setCopiedKey(true);
    toast.success('Private key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConfirmColdWallet = () => {
    toast.success('Cold wallet created! Make sure you saved your private key.');
    setNewWalletResult(null);
    setShowModal(false);
    fetchWallets();
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', storageType: 'hot' });
    setCopiedKey(false);
  };

  const closeModal = () => {
    if (!newWalletResult) {
      setShowModal(false);
      resetForm();
    }
  };

  const formatBTC = (satoshis) => {
    return (satoshis / 100000000).toFixed(8);
  };

  if (loading) {
    return (
      <div className="wallets-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="wallets-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>Wallets</h1>
            <p>Manage your Bitcoin wallets with hot and cold storage options</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <PlusIcon className="btn-icon-left" />
            Create Wallet
          </button>
        </div>

        {/* Storage Type Info */}
        <div className="storage-info">
          <div className="storage-card hot">
            <FireIcon className="storage-icon" />
            <div>
              <h4>Hot Wallet</h4>
              <p>Private key encrypted & stored on server. Instant transactions.</p>
            </div>
          </div>
          <div className="storage-card cold">
            <ShieldCheckIcon className="storage-icon" />
            <div>
              <h4>Cold Wallet</h4>
              <p>Private key never stored. Maximum security, manual signing required.</p>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        {wallets.length > 0 ? (
          <div className="wallets-grid">
            {wallets.map((wallet, index) => (
              <motion.div
                key={wallet._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link 
                  to={`/wallets/${wallet._id}`}
                  className="wallet-card"
                  style={{ '--wallet-color': wallet.color }}
                >
                  <div className="wallet-card-header">
                    <div className="wallet-icon">
                      <WalletIcon />
                    </div>
                    <span className={`badge badge-${wallet.storageType}`}>
                      {wallet.storageType === 'hot' ? (
                        <><FireIcon className="badge-icon" /> Hot</>
                      ) : (
                        <><ShieldCheckIcon className="badge-icon" /> Cold</>
                      )}
                    </span>
                  </div>
                  <div className="wallet-card-body">
                    <h3 className="wallet-name">{wallet.name}</h3>
                    <p className="wallet-address">
                      {wallet.maskedAddress}
                    </p>
                  </div>
                  <div className="wallet-card-footer">
                    <div className="wallet-balance">
                      <span className="balance-btc">{formatBTC(wallet.balance)} BTC</span>
                      <span className="balance-usd">
                        ≈ ${((wallet.balance / 100000000) * 43256.78).toLocaleString()}
                      </span>
                    </div>
                    <div className="wallet-tx-count">
                      {wallet.transactionCount} transactions
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-wallets">
            <WalletIcon className="empty-icon" />
            <h3>No Wallets Yet</h3>
            <p>Create your first Bitcoin wallet to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <PlusIcon className="btn-icon-left" />
              Create Your First Wallet
            </button>
          </div>
        )}
      </motion.div>

      {/* Create Wallet Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!newWalletResult ? (
                <>
                  <div className="modal-header">
                    <h3 className="modal-title">Create New Wallet</h3>
                    <button className="modal-close" onClick={closeModal}>
                      <XMarkIcon />
                    </button>
                  </div>
                  <form onSubmit={handleCreateWallet}>
                    <div className="modal-body">
                      <div className="form-group">
                        <label className="form-label">Wallet Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="My Bitcoin Wallet"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Savings wallet for..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Storage Type</label>
                        <div className="storage-selector">
                          <button
                            type="button"
                            className={`storage-option ${formData.storageType === 'hot' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, storageType: 'hot' })}
                          >
                            <FireIcon className="option-icon" />
                            <span className="option-title">Hot Wallet</span>
                            <span className="option-desc">Encrypted key on server</span>
                          </button>
                          <button
                            type="button"
                            className={`storage-option ${formData.storageType === 'cold' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, storageType: 'cold' })}
                          >
                            <ShieldCheckIcon className="option-icon" />
                            <span className="option-title">Cold Wallet</span>
                            <span className="option-desc">Key never stored</span>
                          </button>
                        </div>
                      </div>

                      {formData.storageType === 'cold' && (
                        <div className="warning-box">
                          <ExclamationTriangleIcon />
                          <div>
                            <strong>Important:</strong> With cold storage, your private key will only be shown ONCE. 
                            You must save it securely - we cannot recover it for you.
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={creating}>
                        {creating ? 'Creating...' : 'Create Wallet'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="modal-header">
                    <h3 className="modal-title">Save Your Private Key</h3>
                  </div>
                  <div className="modal-body">
                    <div className="success-message">
                      <ShieldCheckIcon className="success-icon" />
                      <h4>Cold Wallet Created!</h4>
                      <p>Your wallet "{newWalletResult.wallet.name}" has been created successfully.</p>
                    </div>

                    <div className="warning-box critical">
                      <ExclamationTriangleIcon />
                      <div>
                        <strong>⚠️ SAVE THIS PRIVATE KEY NOW!</strong>
                        <br />
                        This is the ONLY time your private key will be shown. 
                        If you lose it, you will lose access to all funds in this wallet forever.
                      </div>
                    </div>

                    <div className="private-key-display">
                      <label className="form-label">Private Key (Hex)</label>
                      <div className="key-box">
                        <code>{newWalletResult.privateKey}</code>
                        <button 
                          type="button" 
                          className="copy-btn"
                          onClick={handleCopyPrivateKey}
                        >
                          {copiedKey ? <CheckIcon /> : <ClipboardIcon />}
                        </button>
                      </div>
                    </div>

                    <div className="private-key-display">
                      <label className="form-label">Private Key (WIF Format)</label>
                      <div className="key-box">
                        <code>{newWalletResult.privateKeyWIF}</code>
                      </div>
                    </div>

                    <div className="public-address-display">
                      <label className="form-label">Public Address</label>
                      <div className="address-box">
                        <code>{newWalletResult.wallet.publicAddress}</code>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-primary btn-block"
                      onClick={handleConfirmColdWallet}
                    >
                      I Have Saved My Private Key
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallets;
