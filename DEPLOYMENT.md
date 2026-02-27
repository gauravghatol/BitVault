# Deployment Guide for Wallet Simulator

## 🚀 Quick Setup

Your app is configured to work with:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas (already connected)

---

## 📋 Backend Deployment (Render)

### Environment Variables to Set in Render Dashboard

Go to your Render dashboard → Your service → Environment → Add the following:

```env
NODE_ENV=production
PORT=5000

# MongoDB (Already configured - keep your current connection string)
MONGODB_URI=mongodb+srv://gauravghatol17:YCVMNqaYPMOTfE7V@project1.h6t7ulv.mongodb.net/WalletSimulator?appName=Project1

# JWT Configuration (Already configured - keep these)
JWT_SECRET=b83168e6d5111e082f99fbb03e7708b56fffc158a32844414ca525d446ad20cb53db72b55df2733b4d0e5f6016ea2b625550383d600276b65efc27a59ba58bdf
JWT_EXPIRE=7d

# Encryption (Already configured - keep these)
ENCRYPTION_KEY=00bccc1de1beb25fad4b4cc6d7479ad4dc56cb97af555d8c4555a6b5fe0befd4
ENCRYPTION_IV_LENGTH=16

# Integrity Secret (Already configured - keep this)
INTEGRITY_SECRET=4fdc68227d925e691dbbf09933ae4cbc8540e8e680b745603bfc22be0564c135

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS - IMPORTANT: Update with your Vercel frontend URL
CORS_ORIGIN=https://your-app-name.vercel.app

# Bitcoin Network
BITCOIN_NETWORK=testnet

# Email Configuration (Already configured - keep these)
EMAIL_USER=gauravghatol4@gmail.com
EMAIL_PASS=fkvytxuqfemcaito
```

### Render Build & Start Commands

**Build Command:**
```bash
cd backend && npm install
```

**Start Command:**
```bash
cd backend && npm start
```

**Root Directory:** `/` or leave blank

---

## 🎨 Frontend Deployment (Vercel)

### Environment Variables to Set in Vercel Dashboard

Go to Vercel → Your project → Settings → Environment Variables:

```env
# IMPORTANT: Update with your Render backend URL
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

### Vercel Build Settings

**Framework Preset:** Create React App

**Root Directory:** `frontend`

**Build Command:** `npm run build`

**Output Directory:** `build`

**Install Command:** `npm install`

---

## ⚙️ Important Configuration Steps

### 1. Update CORS in Backend

After deploying to Vercel, update the `CORS_ORIGIN` in Render:

1. Get your Vercel URL (e.g., `https://wallet-simulator.vercel.app`)
2. Go to Render → Environment
3. Update `CORS_ORIGIN` with your Vercel URL
4. Click "Save Changes" (this will redeploy)

### 2. Update API URL in Frontend

After deploying backend to Render:

1. Get your Render URL (e.g., `https://wallet-simulator.onrender.com`)
2. Go to Vercel → Settings → Environment Variables
3. Set `REACT_APP_API_URL` to `https://your-backend.onrender.com/api`
4. Redeploy frontend

---

## 🔐 Security Checklist

- [x] `.env` files are in `.gitignore` ✅
- [ ] Update `CORS_ORIGIN` with actual Vercel URL
- [ ] Update `REACT_APP_API_URL` with actual Render URL
- [ ] Keep MongoDB credentials secure (never commit to Git)
- [ ] Keep JWT_SECRET secure (current one is fine for production)
- [ ] Keep ENCRYPTION_KEY secure (current one is fine)
- [ ] Email credentials are working

---

## 📦 Git Commands for Deployment

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit with improved error handling"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

If you're using `master` branch instead of `main`:
```bash
git push -u origin master
```

---

## 🔄 Automatic Deployments

### Render
- Automatic deploys from `main` branch
- Every push to GitHub triggers a new deployment

### Vercel
- Automatic deploys from `main` branch  
- Every push to GitHub triggers a new deployment
- Preview deployments for pull requests

---

## 🧪 Testing Your Deployment

### 1. Test Backend
```bash
# Visit your Render URL
https://your-backend.onrender.com/api/health

# Should return: {"success":true,"message":"Server is running"}
```

### 2. Test Frontend
```bash
# Visit your Vercel URL
https://your-app.vercel.app

# Should load the login/register page
```

### 3. Test Full Flow
1. Register a new account
2. Check email for verification code
3. Verify email
4. Login
5. Create a wallet
6. Test transaction

---

## 🐛 Common Issues & Fixes

### CORS Error
**Problem:** Frontend can't connect to backend
**Solution:** Update `CORS_ORIGIN` in Render with your Vercel URL

### API Connection Failed
**Problem:** "Failed to load resources"
**Solution:** Update `REACT_APP_API_URL` in Vercel with your Render URL

### Database Connection Failed
**Problem:** MongoDB timeout
**Solution:** 
1. Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
2. Verify connection string is correct

### Email Not Sending
**Problem:** OTP emails not arriving
**Solution:** 
1. Verify Gmail App Password is correct
2. Check spam folder
3. Make sure 2FA is enabled on Gmail account

---

## 📊 Current Configuration

✅ **Database:** MongoDB Atlas (Connected)
✅ **Email Service:** Gmail SMTP (Configured)
✅ **Authentication:** JWT (Configured)
✅ **Encryption:** AES-256-GCM (Configured)
✅ **Bitcoin Network:** Testnet (Safe for demo)

---

## 🎯 After Deployment URLs

Update these in the respective platforms:

**Render Backend:** `https://your-backend.onrender.com`
**Vercel Frontend:** `https://your-app.vercel.app`

### Final ENV Updates:

**In Render (Backend):**
```
CORS_ORIGIN=https://your-app.vercel.app
```

**In Vercel (Frontend):**
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

---

## ✨ Your App is Ready!

Once deployed, your users can:
- ✅ Register and verify email
- ✅ Create Hot Wallets (encrypted private keys)
- ✅ Create Cold Wallets (user manages private keys)
- ✅ Send Bitcoin transactions (testnet)
- ✅ View transaction history
- ✅ Check wallet balances
- ✅ Tamper detection on wallet data

---

**Need help?** Check the logs in Render/Vercel dashboards for any errors.
