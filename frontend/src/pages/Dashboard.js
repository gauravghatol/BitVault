import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../services/api';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getData();
      setData(response.data.data || { stats: {}, recentTransactions: [] });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData({ stats: {}, recentTransactions: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const formatBTC = (satoshis) => {
    return (satoshis / 100000000).toFixed(8);
  };

  const formatUSD = (btc) => {
    return (btc * 43256.78).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  return (
    <div className="dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Overview of your Bitcoin wallets and transactions</p>
          </div>
          <div className="header-actions">
            <Link to="/wallets" className="btn btn-secondary">
              <WalletIcon className="btn-icon-left" />
              View Wallets
            </Link>
            <Link to="/send" className="btn btn-primary">
              <PaperAirplaneIcon className="btn-icon-left" />
              Send
            </Link>
          </div>
        </div>

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-card-content">
            <div className="balance-info">
              <span className="balance-label">Total Balance</span>
              <h2 className="balance-btc">
                {formatBTC(data?.overview?.totalBalance || 0)} BTC
              </h2>
              <span className="balance-usd">
                ≈ {formatUSD(data?.overview?.totalBalanceBTC || 0)}
              </span>
            </div>
            <div className="balance-icon">
              <ShieldCheckIcon />
            </div>
          </div>
          <div className="balance-stats">
            <div className="balance-stat">
              <span className="stat-value">{data?.overview?.totalWallets || 0}</span>
              <span className="stat-label">Wallets</span>
            </div>
            <div className="balance-stat">
              <span className="stat-value">{data?.overview?.hotWallets || 0}</span>
              <span className="stat-label">Hot</span>
            </div>
            <div className="balance-stat">
              <span className="stat-value">{data?.overview?.coldWallets || 0}</span>
              <span className="stat-label">Cold</span>
            </div>
            <div className="balance-stat">
              <span className="stat-value">{data?.overview?.totalTransactions || 0}</span>
              <span className="stat-label">Transactions</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon sent">
              <ArrowUpIcon />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Sent</span>
              <span className="stat-value">
                {formatBTC(data?.transactionSummary?.totalSent || 0)} BTC
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon received">
              <ArrowDownIcon />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Received</span>
              <span className="stat-value">
                {formatBTC(data?.transactionSummary?.totalReceived || 0)} BTC
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon fees">
              <WalletIcon />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Fees</span>
              <span className="stat-value">
                {formatBTC(data?.transactionSummary?.totalFees || 0)} BTC
              </span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="dashboard-grid">
          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Transactions</h3>
              <Link to="/transactions" className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>
            <div className="transactions-list">
              {data?.recentTransactions?.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <div key={tx.txId} className="transaction-item">
                    <div className={`tx-icon ${tx.type}`}>
                      {tx.type === 'send' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    </div>
                    <div className="tx-info">
                      <span className="tx-type">
                        {tx.type === 'send' ? 'Sent' : 'Received'}
                      </span>
                      <span className="tx-address">
                        {tx.type === 'send' 
                          ? `To: ${tx.toAddress.slice(0, 8)}...${tx.toAddress.slice(-8)}`
                          : `From: ${tx.fromAddress.slice(0, 8)}...${tx.fromAddress.slice(-8)}`
                        }
                      </span>
                    </div>
                    <div className="tx-amount">
                      <span className={`amount ${tx.type}`}>
                        {tx.type === 'send' ? '-' : '+'}{formatBTC(tx.amount)} BTC
                      </span>
                      <span className="tx-date">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No transactions yet</p>
                  <Link to="/send" className="btn btn-primary btn-sm">
                    Send your first transaction
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Wallets Preview */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your Wallets</h3>
              <Link to="/wallets" className="btn btn-ghost btn-sm">
                Manage
              </Link>
            </div>
            <div className="wallets-preview">
              {data?.wallets?.length > 0 ? (
                data.wallets.map((wallet) => (
                  <Link 
                    key={wallet._id} 
                    to={`/wallets/${wallet._id}`}
                    className="wallet-preview-item"
                    style={{ '--wallet-color': wallet.color }}
                  >
                    <div className="wallet-preview-icon">
                      <WalletIcon />
                    </div>
                    <div className="wallet-preview-info">
                      <span className="wallet-name">{wallet.name}</span>
                      <span className={`wallet-type ${wallet.storageType}`}>
                        {wallet.storageType} wallet
                      </span>
                    </div>
                    <div className="wallet-preview-balance">
                      <span className="balance">{formatBTC(wallet.balance)} BTC</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <p>No wallets created yet</p>
                  <Link to="/wallets" className="btn btn-primary btn-sm">
                    <PlusIcon className="btn-icon-left" />
                    Create Wallet
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
