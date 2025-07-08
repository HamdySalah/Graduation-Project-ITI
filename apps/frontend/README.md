# Nurse Platform Frontend

A comprehensive React/Next.js frontend application for the Nurse Platform that connects patients with qualified nurses for home healthcare services.

## 🚀 Features

### **Authentication & User Management**
- ✅ User registration (Patient/Nurse/Admin roles)
- ✅ Secure login with JWT tokens
- ✅ Role-based access control
- ✅ Profile management with role-specific fields

### **Patient Features**
- ✅ Create service requests with detailed requirements
- ✅ Search and filter nearby nurses by specialization
- ✅ View nurse profiles and ratings
- ✅ Book nurses directly
- ✅ Track request status and history
- ✅ Dashboard with request statistics

### **Nurse Features**
- ✅ Professional profile with specializations, certifications
- ✅ View and accept available requests
- ✅ Manage availability status
- ✅ Track earnings and completed jobs
- ✅ Update hourly rates and bio

### **Admin Features**
- ✅ Verify nurse credentials and licenses
- ✅ Platform analytics and statistics
- ✅ Manage all users and requests
- ✅ Monitor platform performance
- ✅ Geographic distribution insights

## 📁 Project Structure

```
apps/frontend/
├── components/
│   └── Layout.tsx              # Main layout with navigation
├── lib/
│   ├── api.ts                  # API service layer
│   └── auth.tsx                # Authentication context
├── pages/
│   ├── _app.tsx                # App wrapper
│   ├── index.tsx               # Landing page
│   ├── login.tsx               # Login page
│   ├── register.tsx            # Registration page
│   ├── dashboard.tsx           # Role-based dashboard
│   ├── profile.tsx             # User profile management
│   ├── unauthorized.tsx        # Access denied page
│   ├── requests/
│   │   ├── index.tsx           # Requests list
│   │   ├── create.tsx          # Create request
│   │   └── [id].tsx            # Request details
│   ├── nurses/
│   │   ├── index.tsx           # Find nurses
│   │   └── [id].tsx            # Nurse profile
│   └── admin/
│       ├── index.tsx           # Admin dashboard
│       ├── nurses.tsx          # Nurse management
│       ├── requests.tsx        # Request management
│       └── analytics.tsx       # Platform analytics
└── styles/
    └── globals.css             # Global styles
```

## 🛠️ Technology Stack

- **Framework**: Next.js 15.2.5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT tokens with localStorage
- **HTTP Client**: Fetch API
- **Build Tool**: Next.js built-in

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on port 3001

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Start the development server**
   ```bash
   PORT=3000 npm run dev
   ```

   The app will be available at `http://localhost:3000`

### 🧪 Test Credentials

For testing the application, use these credentials:

**Patient Account:**
- Email: `test@example.com`
- Password: `TestPassword123`
- Role: Patient

4. **Build for production**
   ```bash
   npm run build
   PORT=3000 npm start
   ```

## 📱 Pages Overview

### **Public Pages**
- `/` - Landing page with platform information
- `/login` - User authentication
- `/register` - User registration with role selection
- `/unauthorized` - Access denied page

### **Patient Pages**
- `/dashboard` - Patient dashboard with request statistics
- `/requests` - View all requests with filtering
- `/requests/create` - Create new service request
- `/requests/[id]` - Request details and status
- `/nurses` - Search and filter nurses
- `/nurses/[id]` - Nurse profile details
- `/profile` - Manage patient profile

### **Nurse Pages**
- `/dashboard` - Nurse dashboard with job statistics
- `/requests` - View available requests to accept
- `/requests/[id]` - Request details and actions
- `/profile` - Manage professional profile

### **Admin Pages**
- `/admin` - Admin dashboard with platform overview
- `/admin/nurses` - Manage nurse verifications
- `/admin/requests` - Monitor all requests
- `/admin/analytics` - Platform analytics and insights

## 🔐 Authentication Flow

1. **Registration**: Users select role (Patient/Nurse) and provide required information
2. **Login**: Email/password authentication returns JWT token
3. **Token Storage**: JWT stored in localStorage for persistence
4. **Route Protection**: Pages check authentication and role permissions
5. **Auto-redirect**: Unauthenticated users redirected to login

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Role-based Navigation**: Different menu items based on user role
- **Status Indicators**: Color-coded badges for request/user status
- **Loading States**: Smooth loading spinners and skeleton screens
- **Error Handling**: User-friendly error messages
- **Form Validation**: Client-side validation with helpful feedback

## 🔧 API Integration

The frontend integrates with the backend through a centralized API service (`lib/api.ts`) that handles:

- **Authentication**: Login, register, profile management
- **Requests**: CRUD operations for service requests
- **Nurses**: Search, profile viewing, availability management
- **Admin**: User management, analytics, verifications

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build and test
npm run build
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

## 📊 Performance

- **Build Size**: ~144KB first load JS
- **17 Pages**: All statically generated where possible
- **Optimized**: Next.js automatic optimizations enabled
- **Fast Refresh**: Hot reloading in development

## 🔄 Development Workflow

1. **Start Backend**: Ensure backend API is running on port 3000
2. **Start Frontend**: `npm run dev` on port 3001
3. **Make Changes**: Hot reload automatically updates
4. **Test Features**: Use different user roles to test functionality
5. **Build**: `npm run build` before deployment

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Maintain responsive design
4. Add proper error handling
5. Update documentation for new features

## 📝 Notes

- Backend must be running for full functionality
- Default coordinates set to Cairo, Egypt (31.233, 30.033)
- Mock data used in analytics page (replace with real API)
- File upload for nurse documents not yet implemented
- Real-time notifications not yet implemented

## 🆘 Troubleshooting

**Port conflicts**: Use `PORT=3000 npm run dev` to specify port
**API connection**: Check `NEXT_PUBLIC_API_URL` in `.env.local` (should be http://localhost:3001)
**Build errors**: Run `npm run type-check` to identify TypeScript issues
**Authentication issues**: Clear localStorage and re-login
**Backend connection**: Ensure backend is running on port 3001
**CORS issues**: Check that frontend URL is correctly configured in backend
