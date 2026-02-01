import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

// Initialize dark mode on app load
const initializeTheme = () => {
  const savedPreferences = localStorage.getItem('userPreferences');
  const root = document.documentElement;
  
  if (savedPreferences) {
    const parsed = JSON.parse(savedPreferences);
    if (parsed.darkMode !== false) {
      root.classList.add('dark-mode');
    }
  } else {
    // Default to dark mode
    root.classList.add('dark-mode');
    // Save default preferences
    localStorage.setItem('userPreferences', JSON.stringify({
      darkMode: true,
      notifications: true,
      currency: 'USD',
      language: 'en'
    }));
  }
};

// Initialize theme before rendering
initializeTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
