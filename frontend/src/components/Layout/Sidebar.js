import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  WalletIcon,
  PaperAirplaneIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Wallets', href: '/wallets', icon: WalletIcon },
    { name: 'Send', href: '/send', icon: PaperAirplaneIcon },
    { name: 'Transactions', href: '/transactions', icon: ClockIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <ShieldCheckIcon />
          </div>
          <div className="logo-text">
            <span className="logo-name">BitVault</span>
            <span className="logo-tagline">Secure Wallet</span>
          </div>
        </div>
        <button className="sidebar-close" onClick={onClose}>
          <XMarkIcon />
        </button>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.fullName}</span>
          <span className="user-email">{user?.email}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                onClick={onClose}
              >
                <item.icon className="nav-icon" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-footer">
        <div className="network-badge">
          <span className="network-dot"></span>
          <span>Testnet</span>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          <ArrowRightOnRectangleIcon className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
