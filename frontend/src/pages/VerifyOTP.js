import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import './Auth.css';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Redirect if no email
    if (!email) {
      toast.error('Please register first');
      navigate('/register');
      return;
    }

    // Timer for resend button
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [email, navigate, timer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      while (newOtp.length < 6) newOtp.push('');
      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpCode
      });

      if (response.data.success) {
        // Store token
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        toast.success('Email verified successfully! Welcome to BitVault!');
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      const response = await api.post('/auth/resend-otp', { email });
      
      if (response.data.success) {
        toast.success('Verification code sent! Check your email.');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '500px' }}>
        <motion.div 
          className="auth-form-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ padding: '3rem' }}
        >
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <div className="branding-logo" style={{ margin: '0 auto 1.5rem' }}>
                <ShieldCheckIcon />
              </div>
              <h2>Verify Your Email</h2>
              <p>We've sent a 6-digit code to</p>
              <p style={{ color: '#f7931a', fontWeight: '600', marginTop: '0.5rem' }}>
                {email}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="otp-input-group">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="otp-input"
                    required
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-block"
                disabled={loading || otp.join('').length !== 6}
                style={{ marginTop: '2rem' }}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            <div className="resend-section">
              {!canResend ? (
                <p className="resend-timer">
                  Resend code in {timer}s
                </p>
              ) : (
                <button 
                  onClick={handleResend}
                  disabled={resending}
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {resending ? (
                    <>
                      <ArrowPathIcon className="icon-spin" style={{ width: '20px', height: '20px' }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon style={{ width: '20px', height: '20px' }} />
                      Resend Code
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="auth-footer" style={{ marginTop: '2rem' }}>
              <p>
                Wrong email?{' '}
                <a href="/register" style={{ color: '#f7931a' }}>Register again</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyOTP;
