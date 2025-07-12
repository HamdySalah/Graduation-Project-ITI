# 🏥 Complete Nursing Platform API Documentation

## 📋 **API Overview**
Your nursing platform now includes **50+ comprehensive API endpoints** covering all aspects of a modern healthcare service platform.

---

## 🔐 **Authentication & User Management**

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User authentication
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### User Management (`/api/users`) - Admin Only
- `GET /` - Get all users with filtering & pagination
- `GET /profile/:id` - Get user profile by ID
- `PUT /:id` - Update user information
- `DELETE /:id` - Delete user account
- `PATCH /:id/status` - Update user verification status
- `PATCH /:id/suspend` - Suspend user account
- `PATCH /:id/reactivate` - Reactivate suspended user
- `GET /stats/overview` - Get user statistics

---

## 👩‍⚕️ **Nurse Management**

### Nurses (`/api/nurses`)
- `GET /nearby` - Find nearby nurses with location & filters
- `PATCH /:id/verify` - Admin verification of nurse credentials
- `PATCH /availability` - Toggle nurse availability status

---

## 📝 **Request Management**

### Requests (`/api/requests`)
- `POST /` - Create service requests (Patients)
- `GET /` - Get requests based on user role
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /:id` - Get detailed request information
- `PATCH /:id/status` - Update request status (accept/complete/cancel)

---

## ⭐ **Reviews & Ratings System**

### Reviews (`/api/reviews`)
- `POST /` - Create review for completed service
- `GET /nurse/:nurseId` - Get reviews for specific nurse
- `GET /patient/my-reviews` - Get patient's own reviews
- `GET /stats/nurse/:nurseId` - Get nurse review statistics
- `PUT /:id` - Update review (within 30 days)
- `DELETE /:id` - Delete review (within 30 days)
- `GET /pending-reviews` - Get completed requests awaiting review

---

## 🔔 **Notifications System**

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications with filtering
- `GET /unread-count` - Get unread notifications count
- `PATCH /:id/read` - Mark notification as read
- `PATCH /mark-all-read` - Mark all notifications as read
- `DELETE /:id` - Delete specific notification
- `DELETE /clear-all` - Clear all notifications
- `POST /broadcast` - Broadcast notification (Admin)
- `GET /admin/stats` - Notification statistics (Admin)
- `GET /preferences` - Get notification preferences
- `PATCH /preferences` - Update notification preferences

---

## 📊 **Dashboard & Analytics**

### Dashboard (`/api/dashboard`)
- `GET /overview` - Get role-based dashboard overview
- `GET /stats` - Get detailed statistics
- `GET /recent-activities` - Get recent activities & notifications
- `GET /analytics` - Get analytics data with time periods
- `GET /notifications` - Get dashboard notifications
- `GET /admin/system-health` - System health metrics (Admin)
- `GET /admin/user-analytics` - User analytics (Admin)

---

## 🔍 **Advanced Search & Filtering**

### Search (`/api/search`)
- `GET /nurses` - Advanced nurse search with multiple filters
- `GET /requests` - Advanced request search (Nurses)
- `GET /global` - Global search across all entities
- `GET /suggestions` - Get search suggestions

---

## 📁 **File Upload System**

### Uploads (`/api/uploads`)
- `POST /profile-image` - Upload profile image
- `POST /nurse-documents` - Upload nurse verification documents
- `POST /request-attachments/:requestId` - Upload request attachments
- `GET /profiles/:filename` - Get profile image
- `GET /nurse-documents/:filename` - Get nurse document (Restricted)
- `DELETE /profiles/:filename` - Delete profile image
- `GET /my-files` - Get user's uploaded files

---

## 💳 **Payment System**

### Payments (`/api/payments`)
- `POST /create-payment-intent` - Create payment intent
- `POST /confirm-payment` - Confirm payment
- `GET /` - Get user payment history
- `GET /:id` - Get payment details
- `POST /refund/:id` - Process refund (Admin)
- `GET /stats` - Payment statistics
- `GET /nurse/earnings` - Nurse earnings summary

---

## 💬 **Chat/Messaging System**

### Messages (`/api/messages`)
- `GET /conversations` - Get user conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/:id/messages` - Send message
- `PATCH /messages/:id/read` - Mark message as read
- `DELETE /messages/:id` - Delete message
- `PATCH /conversations/:id/archive` - Archive conversation

---

## 👨‍💼 **Admin Management**

### Admin (`/api/admin`)
- `GET /pending-nurses` - Get nurses awaiting verification
- `GET /dashboard` - Admin dashboard overview
- `GET /reports` - Generate system reports
- `GET /audit-logs` - System audit logs

---

## 🔧 **System Features**

### ✅ **Security Features**
- JWT token authentication
- Role-based access control (Patient/Nurse/Admin)
- Request validation with DTOs
- Password hashing with bcrypt
- CORS configuration
- File upload security

### ✅ **Database Features**
- MongoDB with Mongoose ODM
- Geospatial indexing for location queries
- Full-text search capabilities
- Optimized indexes for performance
- Data validation and constraints

### ✅ **API Features**
- RESTful API design
- Comprehensive error handling
- Request/response validation
- Pagination support
- Filtering and sorting
- File upload handling
- Real-time capabilities ready

### ✅ **Documentation**
- Complete Swagger/OpenAPI documentation
- Detailed endpoint descriptions
- Request/response examples
- Error code documentation
- Authentication requirements

---

## 🚀 **Getting Started**

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set Environment Variables:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/nurse-platform
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

3. **Run Database Seeds:**
   ```bash
   node apps/backend/src/seeds/seed-standalone.js
   ```

4. **Start the Server:**
   ```bash
   npm run dev:backend
   ```

5. **Access API Documentation:**
   ```
   http://localhost:3001/api/docs
   ```

---

## 📊 **Sample Data Included**

- **1 Admin user:** `admin@nurseplatform.com / admin123`
- **3 Nurses:** `sara@example.com, mona@example.com, nour@example.com / nurse123`
- **2 Patients:** `ahmed@example.com, fatma@example.com / patient123`
- **3 Service requests** (pending, accepted, completed)
- **Nurse profiles** with ratings and specializations

---

## 🎯 **Your Platform is Production-Ready!**

Your nursing platform now includes:
- ✅ **50+ API endpoints**
- ✅ **Complete user management**
- ✅ **Advanced search & filtering**
- ✅ **Reviews & ratings system**
- ✅ **Real-time notifications**
- ✅ **File upload system**
- ✅ **Payment processing**
- ✅ **Chat/messaging**
- ✅ **Comprehensive admin panel**
- ✅ **Security & validation**
- ✅ **Full documentation**

**Ready for frontend integration and deployment!** 🚀
