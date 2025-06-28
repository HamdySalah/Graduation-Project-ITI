# Nurse Platform API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Register a new user (patient, nurse, or admin).

**Request Body:**
```json
{
  "name": "Sara Ibrahim",
  "email": "sara@example.com",
  "password": "password123",
  "phone": "+201234567890",
  "role": "nurse", // "patient", "nurse", or "admin"
  "coordinates": [31.233, 30.033], // [longitude, latitude]
  "address": "Downtown, Cairo, Egypt",
  
  // Required for nurses only:
  "licenseNumber": "NUR001",
  "yearsOfExperience": 5,
  "specializations": ["general", "elderly_care"],
  "education": "Bachelor of Nursing",
  "certifications": ["CPR Certified"],
  "hourlyRate": 50,
  "bio": "Experienced nurse...",
  "languages": ["Arabic", "English"]
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "Sara Ibrahim",
    "email": "sara@example.com",
    "role": "nurse",
    "status": "pending"
  }
}
```

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "sara@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "Sara Ibrahim",
    "email": "sara@example.com",
    "role": "nurse",
    "status": "verified"
  }
}
```

---

## 👩‍⚕️ Nurses Endpoints

### Get Nearby Nurses
**GET** `/api/nurses/nearby`

Find nurses near a specific location.

**Query Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate  
- `radius` (optional): Search radius in kilometers (default: 10)
- `specializations` (optional): Array of specializations to filter by

**Example:**
```
GET /api/nurses/nearby?latitude=30.033&longitude=31.233&radius=5&specializations=general,elderly_care
```

**Response:**
```json
[
  {
    "id": "nurse_id",
    "name": "Sara Ibrahim",
    "email": "sara@example.com",
    "phone": "+201234567890",
    "location": {
      "type": "Point",
      "coordinates": [31.233, 30.033]
    },
    "address": "Downtown, Cairo, Egypt",
    "licenseNumber": "NUR001",
    "yearsOfExperience": 5,
    "specializations": ["general", "elderly_care"],
    "rating": 4.8,
    "totalReviews": 25,
    "completedJobs": 30,
    "hourlyRate": 50,
    "bio": "Experienced nurse...",
    "languages": ["Arabic", "English"],
    "isAvailable": true
  }
]
```

### Verify Nurse (Admin Only)
**PATCH** `/api/nurses/:id/verify`

Verify a nurse's credentials (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Nurse verified successfully",
  "nurse": {
    "id": "nurse_id",
    "name": "Sara Ibrahim",
    "email": "sara@example.com",
    "status": "verified"
  }
}
```

---

## 📋 Requests Endpoints

### Create Service Request
**POST** `/api/requests`

Create a new service request (patients only).

**Headers:**
```
Authorization: Bearer <patient-token>
```

**Request Body:**
```json
{
  "title": "Home Care Needed",
  "description": "Need assistance with elderly care",
  "serviceType": "elderly_care",
  "coordinates": [31.235, 30.035],
  "address": "Zamalek, Cairo, Egypt",
  "scheduledDate": "2024-01-15T10:00:00Z",
  "estimatedDuration": 4,
  "urgencyLevel": "medium",
  "specialRequirements": "Experience with dementia patients",
  "budget": 200,
  "contactPhone": "+201234567890",
  "notes": "Patient prefers Arabic-speaking nurse"
}
```

**Response:**
```json
{
  "id": "request_id",
  "title": "Home Care Needed",
  "description": "Need assistance with elderly care",
  "serviceType": "elderly_care",
  "status": "pending",
  "location": {
    "type": "Point",
    "coordinates": [31.235, 30.035]
  },
  "address": "Zamalek, Cairo, Egypt",
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "createdAt": "2024-01-10T12:00:00.000Z",
  "patient": {
    "id": "patient_id",
    "name": "Ahmed Hassan",
    "phone": "+201234567890"
  }
}
```

### Get Requests
**GET** `/api/requests`

Get requests based on user role:
- **Patients**: See their own requests
- **Nurses**: See assigned requests and available pending requests
- **Admins**: See all requests

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status ("pending", "accepted", "in_progress", "completed", "cancelled")

**Example:**
```
GET /api/requests?status=pending
```

### Update Request Status
**PATCH** `/api/requests/:id/status`

Update the status of a request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "accepted", // "accepted", "in_progress", "completed", "cancelled"
  "cancellationReason": "Patient no longer needs service" // Required for cancelled status
}
```

---

## 👨‍💼 Admin Endpoints

### Get Pending Nurses
**GET** `/api/admin/pending-nurses`

Get all nurses pending verification (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
[
  {
    "id": "nurse_id",
    "name": "Nour Ahmed",
    "email": "nour@example.com",
    "phone": "+201234567894",
    "location": {
      "type": "Point",
      "coordinates": [31.245, 30.045]
    },
    "address": "New Cairo, Egypt",
    "createdAt": "2024-01-10T12:00:00.000Z",
    "licenseNumber": "NUR003",
    "yearsOfExperience": 3,
    "specializations": ["general", "wound_care"],
    "education": "Bachelor of Nursing",
    "documents": ["license.pdf", "certificate.pdf"]
  }
]
```

---

## 📊 Service Types
Available service types for requests:
- `home_care`
- `medication_administration`
- `wound_care`
- `vital_signs_monitoring`
- `post_surgical_care`
- `elderly_care`
- `pediatric_care`
- `chronic_disease_management`

## 🏥 Nurse Specializations
Available specializations:
- `general`
- `pediatric`
- `geriatric`
- `icu`
- `emergency`
- `surgical`
- `psychiatric`
- `oncology`

## 📱 User Roles
- `patient`: Can create and manage service requests
- `nurse`: Can accept and fulfill service requests
- `admin`: Can verify nurses and manage the platform

## 🔄 Request Status Flow
1. `pending` → `accepted` (by nurse)
2. `accepted` → `in_progress` (by nurse)
3. `in_progress` → `completed` (by nurse)
4. Any status → `cancelled` (by patient)

---

## 🚀 Getting Started

1. **Start MongoDB** (default: `mongodb://localhost:27017/nurse-platform`)
2. **Start the backend server:**
   ```bash
   npm run dev:backend
   ```
3. **Server runs on:** `http://localhost:3001`

## 🌱 Sample Data
Run the seeder to populate the database with sample data:
```bash
npx ts-node apps/backend/src/seeds/seed.ts
```

**Sample Accounts:**
- **Admin:** `admin@nurseplatform.com` / `admin123`
- **Nurses:** `sara@example.com`, `mona@example.com` / `nurse123`
- **Patients:** `ahmed@example.com`, `fatma@example.com` / `patient123`
