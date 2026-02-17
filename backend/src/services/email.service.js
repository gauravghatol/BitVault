/**
 * Email Service
 * Handles email sending functionality using nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter with Gmail
const createTransporter = () => {
  // Log for debugging
  console.log('Email Config - USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
  console.log('Email Config - PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing. Set EMAIL_USER and EMAIL_PASS environment variables.');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP verification email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP
 * @param {string} firstName - User's first name
 */
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'BitVault',
        address: 'gauravghatol4@gmail.com'
      },
      to: email,
      subject: 'BitVault - Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #0a0a0f;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #12121a;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .header {
              background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
              padding: 40px 30px;
              text-align: center;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #f7931a 0%, #ff9f2d 100%);
              border-radius: 12px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 30px;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              margin: 0;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
              color: #a0a0b0;
            }
            .greeting {
              color: #ffffff;
              font-size: 18px;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .otp-container {
              background: #1a1a2e;
              border: 2px solid rgba(247, 147, 26, 0.3);
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-label {
              color: #a0a0b0;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
            }
            .otp-code {
              font-size: 42px;
              font-weight: 700;
              color: #f7931a;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .otp-expiry {
              color: #6b6b7b;
              font-size: 13px;
              margin-top: 15px;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
              font-size: 14px;
            }
            .footer {
              background: #0f0f1a;
              padding: 30px;
              text-align: center;
              color: #6b6b7b;
              font-size: 13px;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
            }
            .footer a {
              color: #f7931a;
              text-decoration: none;
            }
            .security-tips {
              background: rgba(59, 130, 246, 0.1);
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
              font-size: 14px;
            }
            .security-tips ul {
              margin: 10px 0 0 0;
              padding-left: 20px;
            }
            .security-tips li {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐</div>
              <h1>BitVault</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${firstName},</div>
              
              <div class="message">
                Welcome to <strong style="color: #f7931a;">BitVault</strong>! We're excited to have you join our secure Bitcoin wallet management platform.
              </div>
              
              <div class="message">
                To complete your registration and activate your account, please verify your email address using the One-Time Password (OTP) below:
              </div>
              
              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">⏱ This code will expire in 10 minutes</div>
              </div>
              
              <div class="message">
                Enter this code in the verification screen to activate your account and start managing your Bitcoin wallets securely.
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Alert:</strong> If you didn't request this verification code, please ignore this email. Your account remains secure.
              </div>
              
              <div class="security-tips">
                <strong>🛡️ Security Tips:</strong>
                <ul>
                  <li>Never share your OTP with anyone</li>
                  <li>BitVault will never ask for your password via email</li>
                  <li>Enable two-factor authentication for extra security</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>BitVault</strong> - Secure Bitcoin Wallet Management</p>
              <p>Maximum security • Keys never stored • SHA-256 integrity verification</p>
              <p style="margin-top: 20px;">
                Need help? Contact us at <a href="mailto:support@bitvault.com">support@bitvault.com</a>
              </p>
              <p style="margin-top: 15px; color: #6b6b7b;">
                © ${new Date().getFullYear()} BitVault. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ OTP Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Email sending error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    throw new Error(`Email service error: ${error.message}`);
  }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 */
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'BitVault',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Welcome to BitVault! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #0a0a0f;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #12121a;
              border-radius: 16px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #f7931a 0%, #ff9f2d 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              color: #000;
              font-size: 32px;
              margin: 0;
            }
            .content {
              padding: 40px 30px;
              color: #a0a0b0;
            }
            .greeting {
              color: #ffffff;
              font-size: 20px;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #f7931a 0%, #ff9f2d 100%);
              color: #000;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #0f0f1a;
              padding: 30px;
              text-align: center;
              color: #6b6b7b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to BitVault!</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${firstName},</div>
              
              <div class="message">
                <strong>Congratulations!</strong> Your account has been successfully verified and activated.
              </div>
              
              <div class="message">
                You can now access all features of BitVault's secure Bitcoin wallet management platform:
              </div>
              
              <ul style="color: #ffffff; line-height: 2;">
                <li>Create and manage multiple wallets</li>
                <li>Send and receive Bitcoin transactions</li>
                <li>Monitor your portfolio in real-time</li>
                <li>Track transaction history</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.CORS_ORIGIN || 'http://localhost:3000'}/login" class="cta-button">Login to Your Account</a>
              </div>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} BitVault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✓ Welcome email sent successfully');
  } catch (error) {
    console.error('✗ Welcome email failed (non-critical):', error.message);
    // Don't throw error for welcome email - it's not critical
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail
};
