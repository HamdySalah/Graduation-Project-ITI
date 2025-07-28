# Database Seed Data

This directory contains comprehensive seed data for the CareConnect nursing platform.

## 🌱 What Gets Seeded

### 👑 Admin Users (2)
- **System Administrator** - Main admin account
- **Sarah Johnson** - Operations admin

### 🏥 Patient Users (4)
- **Ahmed Hassan** - Verified patient (has completed requests)
- **Fatima Al-Zahra** - Verified patient (has completed requests)
- **Omar Mahmoud** - Verified patient (has pending request)
- **Maryam Ibrahim** - Pending verification patient

### 👩‍⚕️ Nurse Users (4)
- **Dr. Amira Mostafa** - Verified nurse (wound care specialist)
- **Nurse Yasmin Ali** - Verified nurse (elderly care specialist)
- **Nurse Khaled Farouk** - Verified nurse (post-surgical care specialist)
- **Dr. Nour Hassan** - Pending verification nurse

### 📋 Nurse Profiles (3)
Complete profiles for verified nurses including:
- License numbers
- Specializations
- Experience levels
- Education background
- Certifications
- Availability schedules
- Hourly rates
- Ratings and reviews

### 📝 Patient Requests (4)
- **1 Completed Request** - Post-surgery wound care (with reviews)
- **1 In Progress Request** - Elderly care assistance
- **1 Pending Request** - Medication administration (with applications)
- **1 Completed Request** - Post-surgical monitoring (with reviews)

### 📋 Applications (2)
- Applications from nurses for the pending medication request

### ⭐ Reviews (7)
Complete mutual review system data:
- **User-to-User Reviews** - Patients reviewing nurses and vice versa
- **Service Reviews** - Both parties reviewing the platform service
- Demonstrates the full review workflow

## 🚀 How to Run

### Option 1: Using npm script (Recommended)
```bash
npm run seed
```

### Option 2: Using the simple script
```bash
npm run seed:simple
```

### Option 3: Direct execution
```bash
cd apps/backend
npx ts-node src/seeds/comprehensive-seed.ts
```

## 🔑 Test Credentials

### Admin Accounts
```
Email: admin@careconnect.com
Password: password123

Email: sarah.admin@careconnect.com
Password: password123
```

### Patient Accounts
```
Email: patient@gmail.com
Password: password123

Email: fatima.patient@gmail.com
Password: password123

Email: omar.patient@gmail.com
Password: password123

Email: maryam.patient@gmail.com
Password: password123
```

### Nurse Accounts
```
Email: nurse@gmail.com
Password: password123

Email: yasmin.nurse@gmail.com
Password: password123

Email: khaled.nurse@gmail.com
Password: password123

Email: nour.nurse@gmail.com
Password: password123
```

## 🧪 Testing Scenarios

### 1. Review System Testing
- Login as `patient@gmail.com`
- Navigate to completed requests
- Click "Reviews" button to see mutual review system
- Test both user-to-user and service reviews

### 2. Request Management
- Login as `omar.patient@gmail.com`
- View pending request with nurse applications
- Test request editing functionality

### 3. Nurse Dashboard
- Login as `nurse@gmail.com`
- View available requests
- Check profile and ratings

### 4. Admin Panel
- Login as `admin@careconnect.com`
- Manage users and requests
- View system statistics

## 📊 Data Statistics

After seeding, you'll have:
- **8 Total Users** (2 admins, 4 patients, 4 nurses)
- **3 Nurse Profiles** (complete professional profiles)
- **4 Patient Requests** (various statuses for testing)
- **2 Applications** (nurse applications to requests)
- **7 Reviews** (demonstrating mutual review system)

## 🔄 Re-running Seeds

The seed script will:
1. **Clear all existing data** from relevant collections
2. **Create fresh seed data** with consistent relationships
3. **Display success summary** with user credentials

⚠️ **Warning**: This will delete all existing data in the database!

## 🗂️ File Structure

```
src/seeds/
├── comprehensive-seed.ts    # Main seed file
├── README.md               # This documentation
└── seed.ts                 # Legacy seed file (if exists)

scripts/
└── run-seed.js            # Simple runner script
```

## 🔧 Customization

To modify the seed data:

1. **Edit user data** in the `comprehensive-seed.ts` file
2. **Adjust locations** by changing coordinates (currently set to Cairo, Egypt)
3. **Modify request scenarios** to test different workflows
4. **Add more reviews** to test the review system thoroughly

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env` file

2. **TypeScript Compilation Error**
   - Run `npm install` to ensure dependencies are installed
   - Check that all imports are correct

3. **Duplicate Key Error**
   - The seed script clears data first, but if interrupted, run it again

4. **Missing Environment Variables**
   - Ensure `.env` file exists with proper MongoDB connection string
   - Check JWT secret and other required variables

## 📈 Next Steps

After seeding:

1. **Start the development server**: `npm run dev`
2. **Visit the application**: `http://localhost:3000`
3. **Login with test accounts** to explore features
4. **Test the review system** with completed requests
5. **Explore admin features** with admin accounts

The seed data provides a complete testing environment for all platform features including the new mutual review system!
