# Nurse Platform Setup Instructions

## Prerequisites

### 1. Install MongoDB
You need MongoDB running locally or use MongoDB Atlas (cloud).

#### Option A: Local MongoDB Installation
- **Windows:** Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- **macOS:** `brew install mongodb-community`
- **Linux:** Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string and update `MONGODB_URI` in environment

### 2. Environment Setup
Create `.env` file in `apps/backend/`:
```bash
# Copy from .env.example
cp apps/backend/.env.example apps/backend/.env
```

Edit the `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/nurse-platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start MongoDB (if using local installation)
```bash
# Windows
net start MongoDB

# macOS/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod
```

### 3. Start the Backend Server
```bash
npm run dev:backend
```

The server will start on `http://localhost:3001`

### 4. Seed Sample Data (Optional)
```bash
npx ts-node apps/backend/src/seeds/seed.ts
```

This creates sample users:
- **Admin:** `admin@nurseplatform.com` / `admin123`
- **Nurses:** `sara@example.com`, `mona@example.com` / `nurse123`  
- **Patients:** `ahmed@example.com`, `fatma@example.com` / `patient123`

## 🧪 Testing the API

### Test Basic Health Check
```bash
curl http://localhost:3001
```
Expected response: `{"message":"Hello API"}`

### Test User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@example.com", 
    "password": "password123",
    "phone": "+201234567890",
    "role": "patient",
    "coordinates": [31.233, 30.033],
    "address": "Test Address, Cairo, Egypt"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Get Nearby Nurses
```bash
curl "http://localhost:3001/api/nurses/nearby?latitude=30.033&longitude=31.233&radius=10"
```

## 📁 Project Structure

```
apps/backend/src/
├── schemas/           # MongoDB schemas
│   ├── user.schema.ts
│   ├── nurse-profile.schema.ts
│   └── patient-request.schema.ts
├── dto/              # Data Transfer Objects
│   ├── auth.dto.ts
│   └── request.dto.ts
├── auth/             # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── nurses/           # Nurses module
│   ├── nurses.controller.ts
│   ├── nurses.service.ts
│   └── nurses.module.ts
├── requests/         # Requests module
│   ├── requests.controller.ts
│   ├── requests.service.ts
│   └── requests.module.ts
├── admin/            # Admin module
│   ├── admin.controller.ts
│   └── admin.module.ts
├── seeds/            # Database seeder
│   └── seed.ts
└── app/              # Main app module
    ├── app.module.ts
    ├── app.controller.ts
    └── app.service.ts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev:backend          # Start backend in development mode
npm run dev:frontend         # Start frontend in development mode  
npm run dev                  # Start both frontend and backend

# Production
npm run build               # Build both applications
npm run start              # Start both applications in production

# Backend only
nx serve backend           # Start backend
nx build backend          # Build backend
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
1. **Check if MongoDB is running:**
   ```bash
   # Check MongoDB status
   brew services list | grep mongodb  # macOS
   sudo systemctl status mongod       # Linux
   ```

2. **Check MongoDB logs:**
   ```bash
   # Default log locations
   # macOS: /usr/local/var/log/mongodb/mongo.log
   # Linux: /var/log/mongodb/mongod.log
   ```

3. **Test MongoDB connection:**
   ```bash
   mongo --eval "db.adminCommand('ismaster')"
   ```

### Port Already in Use
If port 3001 is already in use:
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### JWT Token Issues
- Make sure `JWT_SECRET` is set in your `.env` file
- Tokens expire after 24 hours by default
- Include `Authorization: Bearer <token>` header for protected routes

## 📚 API Documentation
See `API_DOCUMENTATION.md` for complete API reference with examples.

## 🔐 Security Notes
- Change `JWT_SECRET` in production
- Use HTTPS in production
- Validate and sanitize all inputs
- Implement rate limiting
- Use environment variables for sensitive data
