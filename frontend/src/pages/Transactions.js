import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import './Transactions.css';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [verifying, setVerifying] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      console.log('Transactions Response:', res.data);
      const txData = res.data.data.transactions || res.data.data || [];
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const verifyTransaction = async (txId) => {
    setVerifying(prev => ({ ...prev, [txId]: true }));
    try {
      const res = await api.get(`/transactions/${txId}/verify`);
      const isValid = res.data.data.isValid;
      
      setTransactions(prev => prev.map(tx => 
        tx._id === txId ? { ...tx, integrityVerified: isValid } : tx
      ));
      
      if (isValid) {
        toast.success('Transaction integrity verified');
      } else {
        toast.error('Transaction integrity check failed - possible tampering detected');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setVerifying(prev => ({ ...prev, [txId]: false }));
    }
  };

  const formatBTC = (satoshis) => {
    return (satoshis / 100000000).toFixed(8);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateAddress = (address, start = 8, end = 8) => {
    if (!address || address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="status-icon confirmed" />;
      case 'pending':
        return <ClockIcon className="status-icon pending" />;
      case 'failed':
        return <XCircleIcon className="status-icon failed" />;
      default:
        return null;
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.toAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.fromAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: transactions.length,
    sent: transactions.filter(tx => tx.type === 'send').length,
    received: transactions.filter(tx => tx.type === 'receive').length,
    pending: transactions.filter(tx => tx.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="transactions-page">
        <div className="transactions-loading">
          <div className="spinner-lg"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1>Transactions</h1>
          <p>View and verify all your Bitcoin transactions</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tx-stats-row">
        <div className="tx-stat-card">
          <span className="tx-stat-value">{stats.total}</span>
          <span className="tx-stat-label">Total</span>
        </div>
        <div className="tx-stat-card">
          <span className="tx-stat-value sent">{stats.sent}</span>
          <span className="tx-stat-label">Sent</span>
        </div>
        <div className="tx-stat-card">
          <span className="tx-stat-value received">{stats.received}</span>
          <span className="tx-stat-label">Received</span>
        </div>
        <div className="tx-stat-card">
          <span className="tx-stat-value pending">{stats.pending}</span>
          <span className="tx-stat-label">Pending</span>
        </div>
      </div>

      {/* Filters */}
      <div className="tx-filters">
        <div className="search-wrapper">
          <MagnifyingGlassIcon />
          <input
            type="text"
            placeholder="Search by hash, address, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <FunnelIcon />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="send">Sent</option>
            <option value="receive">Received</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="no-transactions-full">
          <div className="empty-icon">📋</div>
          <h3>No transactions found</h3>
          <p>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Send or receive BTC to see transactions here'}
          </p>
        </div>
      ) : (
        <motion.div
          className="transactions-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {paginatedTransactions.map((tx, index) => (
            <motion.div
              key={tx._id}
              className="transaction-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="tx-card-left">
                <div className={`tx-icon ${tx.type}`}>
                  {tx.type === 'send' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                </div>
                <div className="tx-info">
                  <div className="tx-info-top">
                    <span className={`tx-type ${tx.type}`}>
                      {tx.type === 'send' ? 'Sent' : 'Received'}
                    </span>
                    {getStatusIcon(tx.status)}
                    <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                  </div>
                  <div className="tx-addresses">
                    {tx.type === 'send' ? (
                      <span>To: {truncateAddress(tx.toAddress)}</span>
                    ) : (
                      <span>From: {truncateAddress(tx.fromAddress)}</span>
                    )}
                  </div>
                  <div className="tx-hash">
                    <code>{truncateAddress(tx.txHash, 16, 16)}</code>
                  </div>
                  {tx.description && (
                    <div className="tx-description">{tx.description}</div>
                  )}
                </div>
              </div>

              <div className="tx-card-right">
                <div className={`tx-amount ${tx.type}`}>
                  {tx.type === 'send' ? '-' : '+'}
                  {formatBTC(tx.amount)} BTC
                </div>
                <div className="tx-date">{formatDate(tx.createdAt)}</div>
                
                <button
                  className={`verify-btn ${tx.integrityVerified === true ? 'verified' : tx.integrityVerified === false ? 'failed' : ''}`}
                  onClick={() => verifyTransaction(tx._id)}
                  disabled={verifying[tx._id]}
                >
                  {verifying[tx._id] ? (
                    <span className="spinner-sm"></span>
                  ) : tx.integrityVerified === true ? (
                    <>
                      <ShieldCheckIcon /> Verified
                    </>
                  ) : tx.integrityVerified === false ? (
                    <>
                      <ExclamationTriangleIcon /> Tampered
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon /> Verify
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - currentPage) <= 1
              )
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                  <button
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Transactions;
