# 🔐 Environment Variables Setup Guide

## ✅ **Environment Files Added to .gitignore**

Your environment files are now properly protected and will **NEVER** be committed to Git:

### **Protected Files:**
- ✅ `.env` (root level)
- ✅ `.env.local` (frontend)
- ✅ `apps/backend/.env` (backend)
- ✅ `apps/frontend/.env.local` (frontend)
- ✅ All environment variants (development, production, test, staging)
- ✅ Upload directories (`uploads/`, `apps/backend/uploads/`)

## 🚀 **Setup Instructions**

### **1. Backend Environment Setup**

Copy the example file and configure your values:
```bash
cp apps/backend/.env.example apps/backend/.env
```

Then edit `apps/backend/.env` with your actual values:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/nurse-platform

# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_OPENAI_KEY_HERE

# Stripe Configuration (Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET
STRIPE_CURRENCY=egp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
```

### **2. Frontend Environment Setup**

Copy the example file and configure your values:
```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

Then edit `apps/frontend/.env.local` with your actual values:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stripe Configuration (Frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY
```

## 🔑 **How to Get API Keys**

### **OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login
3. Go to API Keys section
4. Create a new secret key
5. Copy the key (starts with `sk-proj-`)

### **Stripe API Keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up/Login
3. Go to Developers → API Keys
4. Copy your **Test** keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### **Stripe Webhook Secret:**
1. In Stripe Dashboard, go to Developers → Webhooks
2. Create a new webhook endpoint: `http://localhost:3001/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook secret (starts with `whsec_`)

## ⚠️ **Security Best Practices**

### **DO:**
- ✅ Use the `.env.example` files as templates
- ✅ Keep your actual API keys private
- ✅ Use different keys for development and production
- ✅ Regenerate keys if they're accidentally exposed
- ✅ Use strong, unique JWT secrets (minimum 32 characters)

### **DON'T:**
- ❌ Commit `.env` files to Git
- ❌ Share API keys in chat/email
- ❌ Use production keys in development
- ❌ Hardcode secrets in your code
- ❌ Use weak JWT secrets

## 🧪 **Testing Your Setup**

### **1. Test Backend Environment:**
```bash
cd apps/backend
npm run dev
```

Check the console for any missing environment variable errors.

### **2. Test Frontend Environment:**
```bash
cd apps/frontend
npm run dev
```

Check that the app connects to the backend API.

### **3. Test API Keys:**
- **OpenAI**: Try the AI chat feature
- **Stripe**: Try creating a payment (use test card: `4242 4242 4242 4242`)
- **Database**: Try registering a new user

## 🔄 **Team Setup**

When new team members join:

1. **Share the setup guide** (this file)
2. **Don't share actual `.env` files**
3. **Help them get their own API keys**
4. **Use the `.env.example` files as reference**

## 🚨 **If Keys Are Exposed**

If you accidentally commit or share API keys:

1. **Immediately regenerate** the exposed keys
2. **Update your `.env` files** with new keys
3. **Revoke the old keys** in the respective dashboards
4. **Check Git history** and remove sensitive commits if needed

## 📁 **File Structure**

```
project-root/
├── .gitignore                     # Protects all .env files
├── apps/
│   ├── backend/
│   │   ├── .env                   # Your actual backend config (NEVER commit)
│   │   └── .env.example           # Template file (safe to commit)
│   └── frontend/
│       ├── .env.local             # Your actual frontend config (NEVER commit)
│       └── .env.local.example     # Template file (safe to commit)
└── ENVIRONMENT_SETUP.md           # This guide
```

## ✅ **Verification Checklist**

- [ ] Copied `.env.example` files to actual `.env` files
- [ ] Configured all required API keys
- [ ] Backend starts without environment errors
- [ ] Frontend connects to backend successfully
- [ ] AI chat works (OpenAI key is valid)
- [ ] Payment system works (Stripe keys are valid)
- [ ] Database connection works (MongoDB URI is correct)

---

**Your environment is now secure and properly configured!** 🎉
