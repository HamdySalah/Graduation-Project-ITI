# Email Setup Guide for Nurse Registration

## Problem Fixed ✅

The email functionality for nurse registration was not working because:
1. EmailService was not integrated into the AuthService
2. EmailModule was not imported in AuthModule
3. Email templates were missing
4. Email configuration validation was incomplete

## Changes Made

### 1. Integrated Email Service with Registration
- Added EmailModule to AuthModule
- Added EmailService to AuthService constructor
- Added welcome email sending for nurse registrations

### 2. Created Email Templates
- `apps/backend/templates/welcome.hbs` - Welcome email for nurses
- `apps/backend/templates/email-verification.hbs` - Email verification template

### 3. Updated Configuration
- Added email configuration validation in `config.validation.ts`
- Added EmailModule to AppModule

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in `apps/backend/` with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/nurse-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info

# Optional: API Base URL for testing
API_BASE_URL=http://localhost:3001
```

### 2. Gmail SMTP Setup

To use Gmail for sending emails:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `MAIL_PASSWORD`

3. **Alternative: Use Gmail OAuth2** (more secure)

### 3. Test Email Configuration

Run the email test script:

```bash
node test-mail.js
```

### 4. Test Nurse Registration with Email

Run the nurse registration test:

```bash
node test-nurse-registration-email.js
```

## How It Works

### Registration Flow
1. Nurse submits registration form
2. AuthService creates user and nurse profile
3. EmailService sends welcome email automatically
4. Email includes:
   - Welcome message
   - Account status information
   - Next steps for verification
   - Dashboard link

### Email Templates
- **Welcome Email**: Sent to nurses upon successful registration
- **Verification Email**: Available for email verification (if implemented)

## Troubleshooting

### Email Not Sending
1. Check `.env` file configuration
2. Verify Gmail app password is correct
3. Check firewall/network restrictions
4. Test SMTP connection with `test-mail.js`

### Common Issues
- **Authentication failed**: Check app password
- **Connection timeout**: Check network/firewall
- **Invalid host**: Verify `MAIL_HOST` is correct

### Testing
- Use `test-mail.js` to test SMTP configuration
- Use `test-nurse-registration-email.js` to test full registration flow
- Check email inbox and spam folder

## Security Notes

1. **Never commit `.env` file** to version control
2. **Use app passwords** instead of regular passwords
3. **Consider OAuth2** for production environments
4. **Validate email addresses** before sending

## Production Considerations

1. **Use dedicated email service** (SendGrid, AWS SES, etc.)
2. **Implement email verification** for security
3. **Add email templates** for different scenarios
4. **Monitor email delivery** and bounce rates
5. **Implement retry logic** for failed emails

## Arabic Translation / الترجمة العربية

### المشكلة التي تم حلها ✅

لم تكن وظيفة البريد الإلكتروني لتسجيل الممرضات تعمل بسبب:
1. عدم دمج EmailService مع AuthService
2. عدم استيراد EmailModule في AuthModule
3. عدم وجود قوالب البريد الإلكتروني
4. عدم اكتمال التحقق من إعدادات البريد الإلكتروني

### كيفية الإعداد

1. **إنشاء ملف البيئة**: أنشئ ملف `.env` في `apps/backend/`
2. **إعداد Gmail SMTP**: استخدم كلمة مرور التطبيق
3. **اختبار الإعداد**: استخدم `test-mail.js`
4. **اختبار التسجيل**: استخدم `test-nurse-registration-email.js`

### التدفق الجديد
1. تسجيل الممرضة
2. إنشاء الحساب والملف الشخصي
3. إرسال بريد ترحيب تلقائياً
4. تضمين معلومات الحساب والخطوات التالية 