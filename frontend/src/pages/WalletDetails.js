import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { walletAPI, transactionAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  WalletIcon,
  FireIcon,
  ShieldCheckIcon,
  ClipboardIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShieldExclamationIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import './WalletDetails.css';

const WalletDetails = () => {
  const { id } = useParams();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState(null);

  const fetchWalletData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        walletAPI.getById(id),
        transactionAPI.getByWallet(id, { limit: 10 })
      ]);
      setWallet(walletRes.data.data.wallet);
      setTransactions(txRes.data.data.transactions);
    } catch (error) {
      toast.error('Failed to load wallet details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.publicAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const response = await walletAPI.verify(id);
      setIntegrityStatus(response.data.data);
      
      if (response.data.data.isValid) {
        toast.success('Wallet integrity verified!');
      } else {
        toast.error('WARNING: Wallet data may have been tampered with!');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const formatBTC = (satoshis) => {
    return (satoshis / 100000000).toFixed(8);
  };

  if (loading) {
    return (
      <div className="wallet-details-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="wallet-not-found">
        <h2>Wallet Not Found</h2>
        <Link to="/wallets" className="btn btn-primary">
          Back to Wallets
        </Link>
      </div>
    );
  }

  return (
    <div className="wallet-details-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back Link */}
        <Link to="/wallets" className="back-link">
          <ArrowLeftIcon />
          Back to Wallets
        </Link>

        {/* Wallet Header */}
        <div className="wallet-header" style={{ '--wallet-color': wallet.color }}>
          <div className="wallet-header-info">
            <div className="wallet-header-icon">
              <WalletIcon />
            </div>
            <div className="wallet-header-text">
              <div className="wallet-header-top">
                <h1>{wallet.name}</h1>
                <span className={`badge badge-${wallet.storageType}`}>
                  {wallet.storageType === 'hot' ? (
                    <><FireIcon className="badge-icon" /> Hot Wallet</>
                  ) : (
                    <><ShieldCheckIcon className="badge-icon" /> Cold Wallet</>
                  )}
                </span>
              </div>
              {wallet.description && (
                <p className="wallet-description">{wallet.description}</p>
              )}
            </div>
          </div>
          <div className="wallet-header-actions">
            <Link to={`/send?wallet=${wallet._id}`} className="btn btn-primary">
              <PaperAirplaneIcon className="btn-icon-left" />
              Send
            </Link>
            <button 
              className="btn btn-secondary"
              onClick={handleVerifyIntegrity}
              disabled={verifying}
            >
              {verifying ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <ShieldExclamationIcon className="btn-icon-left" />
                  Verify Integrity
                </>
              )}
            </button>
          </div>
        </div>

        {/* Integrity Status */}
        {integrityStatus && (
          <div className={`integrity-status ${integrityStatus.isValid ? 'valid' : 'invalid'}`}>
            {integrityStatus.isValid ? (
              <>
                <CheckIcon />
                <span>Wallet data integrity verified. No tampering detected.</span>
              </>
            ) : (
              <>
                <ShieldExclamationIcon />
                <span>WARNING: Wallet data may have been tampered with!</span>
              </>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="wallet-content">
          {/* Balance Card */}
          <div className="balance-section">
            <div className="balance-card-detail">
              <span className="balance-label">Current Balance</span>
              <h2 className="balance-amount">{formatBTC(wallet.balance)} BTC</h2>
              <span className="balance-usd">
                ≈ ${((wallet.balance / 100000000) * 43256.78).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Address Section */}
          <div className="address-section">
            <h3>Public Address</h3>
            <div className="address-display-full">
              <code>{wallet.publicAddress}</code>
              <button className="copy-btn" onClick={handleCopyAddress}>
                {copied ? <CheckIcon /> : <ClipboardIcon />}
              </button>
            </div>
            <p className="address-note">
              Share this address to receive Bitcoin. Never share your private key.
            </p>
          </div>

          {/* Wallet Info */}
          <div className="wallet-info-section">
            <h3>Wallet Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Network</span>
                <span className="info-value">{wallet.network}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Storage Type</span>
                <span className="info-value capitalize">{wallet.storageType}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Transactions</span>
                <span className="info-value">{wallet.transactionCount}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created</span>
                <span className="info-value">
                  {new Date(wallet.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Activity</span>
                <span className="info-value">
                  {new Date(wallet.lastActivity).toLocaleDateString()}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value badge badge-success">{wallet.status}</span>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="transactions-section">
            <div className="section-header">
              <h3>Transaction History</h3>
              <Link to={`/transactions?wallet=${wallet._id}`} className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>
            {transactions.length > 0 ? (
              <div className="transactions-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Address</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.txId}>
                        <td>
                          <div className={`tx-type-badge ${tx.type}`}>
                            {tx.type === 'send' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                            {tx.type === 'send' ? 'Sent' : 'Received'}
                          </div>
                        </td>
                        <td>
                          <span className="tx-address-cell">
                            {tx.type === 'send' 
                              ? `${tx.toAddress.slice(0, 8)}...${tx.toAddress.slice(-8)}`
                              : `${tx.fromAddress.slice(0, 8)}...${tx.fromAddress.slice(-8)}`
                            }
                          </span>
                        </td>
                        <td>
                          <span className={`tx-amount-cell ${tx.type}`}>
                            {tx.type === 'send' ? '-' : '+'}{formatBTC(tx.amount)} BTC
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${tx.status === 'confirmed' ? 'success' : 'warning'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <span className="tx-date-cell">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-transactions">
                <p>No transactions yet</p>
                <Link to={`/send?wallet=${wallet._id}`} className="btn btn-primary btn-sm">
                  Send your first transaction
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletDetails;
