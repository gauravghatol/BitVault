# Email Service Fix for Production

## Issue
Email sending failing on production (Render) with 500 Internal Server Error during user registration.

## What Was Fixed
1. ✅ Added better error logging and handling
2. ✅ Added SMTP timeout configurations
3. ✅ Improved error messages for users
4. ✅ Fixed from email address to use environment variable
5. ✅ Added authentication error detection

## Required Action in Render

### Check Your Environment Variables

Go to your Render dashboard → Your service → Environment tab and verify:

```env
EMAIL_USER=gauravghatol4@gmail.com
EMAIL_PASS=fkvytxuqfemcaito
```

### Troubleshooting Steps

#### If Email Still Fails After Update:

1. **Check Gmail App Password** (Most Common Issue)
   - Go to: https://myaccount.google.com/apppasswords
   - Make sure 2-Step Verification is enabled
   - Generate a NEW app password
   - Update `EMAIL_PASS` in Render with the new 16-character code
   - **Important:** Remove any spaces from the app password

2. **Check Gmail Account Security**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification" if not already enabled
   - Check "Less secure app access" (should be OFF - use App Passwords instead)

3. **Verify Email Account**
   - Make sure `gauravghatol4@gmail.com` is accessible
   - Try logging in to confirm password works
   - Check if the account has any security alerts

4. **Check Render Logs**
   ```
   Go to Render Dashboard → Your Service → Logs
   ```
   Look for:
   - ❌ Email sending failed for: [email]
   - 🔒 EMAIL AUTH ERROR
   - Error code: EAUTH, ETIMEDOUT, etc.

## Error Messages Explanation

### EAUTH / 535 Error
**Problem:** Email authentication failed
**Solution:** 
- Regenerate Gmail App Password
- Update EMAIL_PASS in Render
- Make sure EMAIL_USER is correct

### ETIMEDOUT / ECONNECTION Error
**Problem:** Network/firewall issue
**Solution:** 
- Usually temporary - retry
- Check if Gmail SMTP is accessible from Render's servers
- Consider using a different email service (SendGrid, Mailgun)

### EENVELOPE Error
**Problem:** Invalid email format
**Solution:** 
- Check the recipient email address format
- Verify EMAIL_USER is a valid Gmail address

## Alternative: Use a Dedicated Email Service

If Gmail continues to have issues, consider using a professional email service:

### Option 1: SendGrid (Recommended)
- Free tier: 100 emails/day
- More reliable for production
- Better deliverability

### Option 2: Mailgun
- Free tier: 5,000 emails/month
- Easy integration

### Option 3: AWS SES
- Very cheap ($0.10 per 1000 emails)
- Highly reliable

## After Deploying This Fix

1. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "Improve email service error handling and logging"
   git push origin main
   ```

2. **Render will auto-deploy** (wait 2-3 minutes)

3. **Check Render Logs** for startup messages:
   ```
   ✅ MongoDB Connected
   📧 Email service configured
   ```

4. **Test Registration:**
   - Visit your Vercel URL
   - Try to register a new account
   - Check Render logs for email sending status

## Testing Email Configuration

You can test if your email service works by checking the logs:

### Successful Email Send:
```
📧 Attempting to send OTP email to: test@example.com
✅ OTP Email sent successfully to: test@example.com | MessageId: <...>
✅ Registration successful for: test@example.com
```

### Failed Email Send:
```
📧 Attempting to send OTP email to: test@example.com
❌ Email sending failed for: test@example.com
Error message: Invalid login: 535-5.7.8 Username and Password not accepted
🔒 EMAIL AUTH ERROR: Check EMAIL_USER and EMAIL_PASS in Render environment variables
```

## Quick Fix Commands

### Regenerate Gmail App Password:
1. Visit: https://myaccount.google.com/apppasswords
2. Generate new password for "Mail"
3. Copy the 16-character code
4. Update in Render: EMAIL_PASS=xxxx xxxx xxxx xxxx (remove spaces)
5. Click "Save Changes" in Render

### If You Change Email Provider:

For SendGrid (example):
```env
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

## Current Status

✅ Code is updated with better error handling
⏳ Waiting for deployment to Render
🔍 Need to verify EMAIL_USER and EMAIL_PASS in Render

## Support

If issues persist after trying all steps:
1. Check Render logs for specific error codes
2. Try regenerating Gmail App Password
3. Consider switching to SendGrid or another email service
4. Contact Render support if network/firewall issue suspected

---

**Last Updated:** February 27, 2026
