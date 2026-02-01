# 🔐 Bitcoin Wallet Management System

A full-stack MERN application simulating a Bitcoin wallet with Hot/Cold storage security models, tamper detection, and professional UI/UX.

> **Portfolio Project**: Demonstrates full-stack development, blockchain concepts, cryptography, and cybersecurity best practices.

## 🌟 Features

### Core Functionality
- **Wallet Generation**: Create Bitcoin wallets with valid public/private key pairs using `bitcoinjs-lib`
- **Hot Wallet Mode**: Encrypted private key storage (AES-256-GCM) for instant transactions
- **Cold Wallet Mode**: Maximum security - private key shown once and NEVER stored
- **Transaction Simulation**: Send/receive BTC with balance verification and fee simulation
- **Tamper Detection**: SHA-256 integrity hashing to detect database manipulation
- **Chain Verification**: Linked transaction hashes for chronological verification

### Security Features
- JWT-based authentication with bcrypt password hashing
- Rate limiting and brute-force protection
- Account lockout after failed login attempts
- CORS and Helmet security headers
- Input validation and sanitization
- AES-256-GCM encryption for hot wallet private keys
- SHA-256 hashing for integrity verification

### UI/UX
- Professional, minimalistic dark theme
- Responsive design for all devices
- Smooth animations with Framer Motion
- Real-time toast notifications
- Interactive data visualizations with Recharts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Dashboard │ │ Wallets  │ │  Send    │ │ Transaction Hist │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Express)                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │Auth Routes │ │Wallet Route│ │ Tx Routes  │ │Security Mid │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    SERVICES LAYER                          │ │
│  │  CryptoService │ WalletService │ TransactionService        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE (MongoDB)                        │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐    │
│  │  Users   │ │   Wallets    │ │      Transactions        │    │
│  └──────────┘ └──────────────┘ └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Models Explained

### Hot Wallet 🔥
```
┌─────────────────────────────────────────────────────────────────┐
│ Creation:                                                        │
│   1. Generate Bitcoin key pair                                   │
│   2. Encrypt private key with AES-256-GCM using secret           │
│   3. Store encrypted key in MongoDB                              │
│                                                                  │
│ Transaction:                                                     │
│   1. Retrieve encrypted key from database                        │
│   2. Decrypt with server secret                                  │
│   3. Sign transaction automatically                              │
│   4. User never handles private key                              │
│                                                                  │
│ Use Case: Convenient for frequent, smaller transactions          │
└─────────────────────────────────────────────────────────────────┘
```

### Cold Wallet ❄️
```
┌─────────────────────────────────────────────────────────────────┐
│ Creation:                                                        │
│   1. Generate Bitcoin key pair                                   │
│   2. Return private key to user ONCE (display only)              │
│   3. Store ONLY public address in MongoDB                        │
│   4. Private key is NEVER stored on server                       │
│                                                                  │
│ Transaction:                                                     │
│   1. User manually enters private key in UI                      │
│   2. Server validates key matches public address                 │
│   3. Sign transaction with provided key                          │
│   4. Key is used momentarily and discarded                       │
│                                                                  │
│ Use Case: Maximum security for large holdings                    │
└─────────────────────────────────────────────────────────────────┘
```

### Tamper Detection 🛡️
```javascript
// Each wallet/transaction has an integrityHash computed from critical fields
integrityHash = SHA256(
  address + balance + status + INTEGRITY_SECRET
)

// Verification compares stored hash vs computed hash
verifyIntegrity() {
  const computedHash = SHA256(currentData + SECRET);
  return storedHash === computedHash;
}

// If someone modifies data directly in MongoDB, hash mismatch = TAMPERING DETECTED
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn
- Gmail account (for email OTP functionality)

### Installation

```bash
# Clone repository
git clone https://github.com/gauravghatol/BitVault
cd wallet-simulator

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### Environment Configuration

#### Backend Setup

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `backend/.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=your_mongodb_connection_string_here

# JWT - Generate a secure secret (required)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Encryption Keys (CRITICAL - Generate secure keys!)
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_32_byte_encryption_key_here_change_this
INTEGRITY_SECRET=your_integrity_secret_key_here_change_this

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# Bitcoin Network (testnet for development, mainnet for production)
BITCOIN_NETWORK=testnet

# Email Configuration (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password_here
```

**⚠️ Security Note:** 
- Never commit `.env` files to version control
- Generate strong, unique keys for production
- Keep `ENCRYPTION_KEY` and `INTEGRITY_SECRET` secure - losing them means you cannot decrypt hot wallet keys!

#### Frontend Setup

1. Copy the example environment file:
```bash
cd frontend
cp .env.example .env
```

2. Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Email Setup (Gmail App Password)

For OTP email verification, you need a Gmail App Password:

1. Go to your Google Account Settings
2. Navigate to Security → 2-Step Verification
3. Scroll to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Add it to `backend/.env` as `EMAIL_PASS`

See [EMAIL_OTP_SETUP.md](EMAIL_OTP_SETUP.md) for detailed instructions.

### Generate Secure Keys

Use these commands to generate secure keys for production:

```bash
# Generate ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate INTEGRITY_SECRET (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Run Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:5000/api/health

---

## 📁 Project Structure

```
wallet-simulator/
├── frontend/                    # React Frontend
│   ├── public/
│   │   └── index.html          # HTML template
│   └── src/
│       ├── components/
│       │   └── Layout/         # Layout components
│       │       ├── Layout.js
│       │       ├── Sidebar.js
│       │       └── Header.js
│       ├── context/
│       │   └── AuthContext.js  # Authentication state
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js
│       │   ├── Wallets.js
│       │   ├── WalletDetails.js
│       │   ├── SendTransaction.js
│       │   ├── Transactions.js
│       │   └── Settings.js
│       ├── services/
│       │   └── api.js          # Axios API client
│       ├── styles/
│       │   └── index.css       # Global styles
│       ├── App.js              # Route configuration
│       └── index.js            # Entry point
│
├── backend/                     # Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── wallet.controller.js
│   │   │   ├── transaction.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.middleware.js
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Wallet.model.js
│   │   │   └── Transaction.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── wallet.routes.js
│   │   │   ├── transaction.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── services/
│   │   │   ├── crypto.service.js
│   │   │   ├── wallet.service.js
│   │   │   └── transaction.service.js
│   │   └── server.js           # Express app setup
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |

### Wallets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallets` | List all user wallets |
| POST | `/api/wallets` | Create new wallet |
| GET | `/api/wallets/:id` | Get wallet details |
| PUT | `/api/wallets/:id` | Update wallet |
| DELETE | `/api/wallets/:id` | Delete wallet |
| GET | `/api/wallets/:id/verify` | Verify integrity |
| GET | `/api/wallets/:id/private-key` | Get hot wallet private key |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions/send` | Send transaction |
| POST | `/api/transactions/receive` | Simulate receive |
| GET | `/api/transactions/:id` | Get transaction details |
| GET | `/api/transactions/:id/verify` | Verify integrity |
| GET | `/api/transactions/wallet/:walletId` | Get wallet transactions |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get statistics |
| GET | `/api/dashboard/recent` | Get recent activity |

---

## 📊 Database Schemas

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed with bcrypt),
  firstName: String,
  lastName: String,
  isActive: Boolean,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Wallet Model
```javascript
{
  user: ObjectId (ref: User),
  name: String,
  description: String,
  address: String (Bitcoin address),
  publicKey: String,
  encryptedPrivateKey: String (null for cold wallets),
  storageType: 'hot' | 'cold',
  network: 'mainnet' | 'testnet',
  balance: Number (in satoshis),
  status: 'active' | 'inactive' | 'archived',
  integrityHash: String (SHA-256),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  user: ObjectId (ref: User),
  wallet: ObjectId (ref: Wallet),
  type: 'send' | 'receive',
  amount: Number (satoshis),
  fee: Number (satoshis),
  fromAddress: String,
  toAddress: String,
  txHash: String (unique),
  status: 'pending' | 'confirmed' | 'failed',
  confirmations: Number,
  description: String,
  previousTxHash: String (chain linking),
  integrityHash: String (SHA-256),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 UI Components

### Pages
- **Dashboard**: Overview with balance, stats, recent transactions
- **Wallets**: Grid of wallets with create modal (hot/cold selection)
- **Wallet Details**: Detailed view with integrity verification
- **Send Transaction**: Form with cold wallet private key entry
- **Transactions**: Full history with filtering and pagination
- **Settings**: Profile, security, preferences

### Key UI Features
- Dark theme with CSS custom properties
- Responsive grid layouts
- Animated transitions (Framer Motion)
- Copy-to-clipboard functionality
- Real-time form validation
- Toast notifications for feedback

---

## 🛠️ Tech Stack

### Frontend
- React 18.2.0
- React Router DOM 6.x
- Framer Motion 10.x
- Recharts 2.x
- React Hot Toast
- Axios
- Heroicons

### Backend
- Node.js 18+
- Express.js 4.x
- Mongoose 8.x
- JWT (jsonwebtoken)
- bcryptjs
- bitcoinjs-lib 6.x
- crypto-js (AES-256-GCM)
- express-validator
- helmet, cors, morgan

### Database
- MongoDB 6+

---

## 🧪 Testing the Security Features

### Test Tamper Detection

1. Create a wallet and note the `integrityHash`
2. Use MongoDB Compass to directly modify the balance
3. Click "Verify Integrity" in the UI
4. Result: **TAMPERING DETECTED** ⚠️

### Test Cold Wallet Flow

1. Create a cold wallet
2. **SAVE THE PRIVATE KEY** shown on creation
3. Try to send a transaction
4. System prompts for private key entry
5. Enter saved private key to sign transaction

### Test Hot Wallet Flow

1. Create a hot wallet
2. Send a transaction
3. Transaction signs automatically (no key entry needed)
4. Private key was decrypted server-side

---

## 🎓 Professor Demonstration Guide

### Quick Start Demo (5 minutes)

**1. Start the Application**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

**2. Create Account & Login**
- Register with email/password
- Login to access dashboard

**3. Create Hot Wallet (Encrypted Storage)**
- Click "Create Wallet" → Select "Hot Wallet"
- Show: Private key is encrypted and stored
- Send a transaction → Signs automatically

**4. Create Cold Wallet (Maximum Security)**
- Click "Create Wallet" → Select "Cold Wallet"
- **CRITICAL**: Show private key is displayed ONCE
- Copy and save the private key
- Try to send transaction → Must enter private key manually
- Explain: Key never stored on server

**5. Demonstrate Tamper Detection**
- Create a wallet and note the integrity hash
- Open MongoDB Compass
- Manually change wallet balance in database
- Return to app → Click "Verify Integrity"
- Result: ⚠️ **TAMPERING DETECTED**

### Full Feature Demonstration (15 minutes)

#### Part 1: Authentication & Security (3 min)
```
✓ Register new user
✓ Show JWT token in browser DevTools
✓ Logout and login again
✓ Show password is hashed (bcrypt) in database
✓ Explain rate limiting (100 req/15min)
```

#### Part 2: Hot Wallet Flow (4 min)
```
✓ Create hot wallet
✓ Show wallet details page
✓ View public address
✓ Check balance (starts with 1 BTC demo balance)
✓ Send transaction to another address
  - Show fee calculation
  - Transaction signs automatically (no key entry)
✓ View transaction in Transactions page
✓ Show transaction integrity verification
```

#### Part 3: Cold Wallet Flow (4 min)
```
✓ Create cold wallet
✓ **COPY PRIVATE KEY** (shown only once!)
✓ Show wallet details (no "Get Private Key" option)
✓ Initiate send transaction
  - App prompts for private key
  - Paste the saved private key
  - Explain: Server validates key matches address
  - Sign transaction on server
✓ Transaction completes
✓ Explain: Key used momentarily, never stored
```

#### Part 4: Security Demonstrations (4 min)

**A. Tamper Detection Test**
```
1. Open MongoDB Compass
2. Connect to your database
3. Find a wallet document
4. Manually change "balance" field (e.g., 100000000 → 999999999)
5. Return to app
6. Click "Verify Integrity" on wallet
7. Result: ❌ TAMPERING DETECTED
8. Explain: SHA-256 hash mismatch
```

**B. Encryption Demonstration**
```
1. Create hot wallet
2. Open MongoDB Compass
3. Show "encryptedPrivateKey" field
4. Copy encrypted string (looks like random characters)
5. Explain: AES-256-GCM encryption
6. Show you cannot decrypt without ENCRYPTION_KEY from .env
```

**C. Chain Verification**
```
1. Send multiple transactions from one wallet
2. Show each transaction has "previousTxHash"
3. Explain: Transactions linked like blockchain
4. Any tampering breaks the chain
```

### Key Points to Emphasize

#### 1. Hot vs Cold Storage
```
┌─────────────────────────────────────────────────────┐
│ Hot Wallet                                          │
│ + Convenient: Auto-sign transactions                │
│ + Fast: No manual key entry                         │
│ - Risk: Private key on server (encrypted)           │
│ Use Case: Frequent, smaller transactions            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Cold Wallet                                         │
│ + Secure: Private key NEVER on server               │
│ + Protected: Impossible to hack if key is offline   │
│ - Inconvenient: Manual key entry each transaction   │
│ Use Case: Large holdings, long-term storage         │
└─────────────────────────────────────────────────────┘
```

#### 2. Cryptography Stack
```
┌─────────────────────────────────────────────────────┐
│ Security Layer         │ Algorithm                  │
├────────────────────────┼────────────────────────────┤
│ Password Hashing       │ bcrypt (10 salt rounds)    │
│ JWT Authentication     │ HMAC SHA-256               │
│ Hot Wallet Encryption  │ AES-256-GCM                │
│ Integrity Hashing      │ SHA-256                    │
│ Bitcoin Keys          │ SECP256k1 (bitcoinjs-lib)  │
└─────────────────────────────────────────────────────┘
```

#### 3. Database Schema Design
```
User Model:
- Password: bcrypt hashed
- loginAttempts: Brute-force protection
- lockUntil: Account lockout

Wallet Model:
- encryptedPrivateKey: NULL for cold wallets
- integrityHash: SHA-256 for tamper detection
- balance: Stored in satoshis (precision)

Transaction Model:
- previousTxHash: Chain linking
- integrityHash: Tamper detection
- signature: Bitcoin signature
```

---

## � Production Deployment

### Pre-Deployment Checklist

- [ ] Set `NODE_ENV=production` in backend `.env`
- [ ] Generate strong, unique production keys
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Configure proper CORS origin (your production domain)
- [ ] Set up SSL/TLS certificates (HTTPS)
- [ ] Enable rate limiting appropriate for production
- [ ] Review and test all security features
- [ ] Set up monitoring and logging
- [ ] Configure automated backups for MongoDB
- [ ] Test email functionality with production credentials

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=generate_new_secure_secret
ENCRYPTION_KEY=generate_new_secure_key
INTEGRITY_SECRET=generate_new_secure_secret
CORS_ORIGIN=https://yourdomain.com
BITCOIN_NETWORK=mainnet  # Use mainnet for real Bitcoin
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASS=your_production_app_password
```

### Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Rotate keys regularly** - Especially after any security incident
3. **Use environment-specific secrets** - Different keys for dev/staging/prod
4. **Monitor for tampering** - Set up alerts for integrity hash failures
5. **Backup encryption keys** - Store securely offline (losing them = losing access to encrypted data)
6. **Use HTTPS only** - Never transmit credentials over HTTP
7. **Regular security audits** - Review logs and database for anomalies

### Deployment Platforms

This application can be deployed on:
- **Backend**: Heroku, AWS (EC2/ECS), Google Cloud, DigitalOcean, Render
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas (recommended), AWS DocumentDB

---

## 📝 Portfolio Notes

This project demonstrates:

1. **Full-Stack Development**: Complete MERN architecture with frontend, backend, and database
2. **Blockchain Concepts**: Bitcoin key generation, transaction signing, wallet management
3. **Cryptography Implementation**: 
   - AES-256-GCM for encryption
   - SHA-256 for integrity hashing
   - bcrypt for password hashing
   - SECP256k1 for Bitcoin signatures
4. **Security Best Practices**: 
   - JWT authentication
   - Rate limiting
   - Input validation
   - CORS protection
   - Email OTP verification
5. **Database Design**: Mongoose schemas with methods, virtuals, and integrity verification
6. **UI/UX Design**: Professional, responsive, accessible interface with animations
7. **API Design**: RESTful endpoints with proper error handling
8. **State Management**: React Context API for authentication

### Technologies Used
- **Frontend**: React 18, React Router, Framer Motion, Recharts, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Cryptography**: bitcoinjs-lib, crypto-js, bcryptjs, nodemailer
- **Security**: JWT, Helmet, CORS, express-validator, rate-limit

---

## ⚠️ Important Disclaimers

1. **Educational Purpose**: This is a simulation/demo project for portfolio demonstration
2. **Not Production-Ready for Real Bitcoin**: Extensive security audits required for handling real funds
3. **Testnet Only**: Use Bitcoin testnet for development and testing
4. **No Warranty**: Use at your own risk - this is a learning project
5. **Private Key Security**: In production, consider hardware security modules (HSM) for key management

---

## 📄 License

MIT License - feel free to use for your portfolio!

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Review the documentation in [EMAIL_OTP_SETUP.md](EMAIL_OTP_SETUP.md)
- Check the [DEMO.md](DEMO.md) for usage examples

---

Made with ❤️ for demonstrating full-stack development and cybersecurity concepts.
