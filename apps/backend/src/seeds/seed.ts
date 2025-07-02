import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../schemas/user.schema';
import { NurseProfile, SpecializationType } from '../schemas/nurse-profile.schema';
import { PatientRequest, RequestStatus, ServiceType } from '../schemas/patient-request.schema';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const nurseProfileModel = app.get<Model<NurseProfile>>(getModelToken(NurseProfile.name));
  const requestModel = app.get<Model<PatientRequest>>(getModelToken(PatientRequest.name));

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await userModel.deleteMany({});
  await nurseProfileModel.deleteMany({});
  await requestModel.deleteMany({});

  // Create admin user
  console.log('👑 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await userModel.create({
    name: 'Admin User',
    email: 'admin@nurseplatform.com',
    password: adminPassword,
    phone: '+1234567890',
    role: UserRole.ADMIN,
    status: UserStatus.VERIFIED,
    location: {
      type: 'Point',
      coordinates: [31.233, 30.033], // Cairo, Egypt
    },
    address: 'Admin Office, Cairo, Egypt',
  });

  // Create sample patients
  console.log('🤒 Creating sample patients...');
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patients = await userModel.insertMany([
    {
      name: 'Ahmed Hassan',
      email: 'ahmed@example.com',
      password: patientPassword,
      phone: '+201234567890',
      role: UserRole.PATIENT,
      status: UserStatus.VERIFIED,
      location: {
        type: 'Point',
        coordinates: [31.235, 30.035],
      },
      address: 'Zamalek, Cairo, Egypt',
    },
    {
      name: 'Fatma Ali',
      email: 'fatma@example.com',
      password: patientPassword,
      phone: '+201234567891',
      role: UserRole.PATIENT,
      status: UserStatus.VERIFIED,
      location: {
        type: 'Point',
        coordinates: [31.240, 30.040],
      },
      address: 'Maadi, Cairo, Egypt',
    },
  ]);

  // Create sample nurses
  console.log('👩‍⚕️ Creating sample nurses...');
  const nursePassword = await bcrypt.hash('nurse123', 12);
  const nurses = await userModel.insertMany([
    {
      name: 'Sara Ibrahim',
      email: 'sara@example.com',
      password: nursePassword,
      phone: '+201234567892',
      role: UserRole.NURSE,
      status: UserStatus.VERIFIED,
      location: {
        type: 'Point',
        coordinates: [31.233, 30.033],
      },
      address: 'Downtown, Cairo, Egypt',
    },
    {
      name: 'Mona Mahmoud',
      email: 'mona@example.com',
      password: nursePassword,
      phone: '+201234567893',
      role: UserRole.NURSE,
      status: UserStatus.VERIFIED,
      location: {
        type: 'Point',
        coordinates: [31.238, 30.038],
      },
      address: 'Heliopolis, Cairo, Egypt',
    },
    {
      name: 'Nour Ahmed',
      email: 'nour@example.com',
      password: nursePassword,
      phone: '+201234567894',
      role: UserRole.NURSE,
      status: UserStatus.PENDING,
      location: {
        type: 'Point',
        coordinates: [31.245, 30.045],
      },
      address: 'New Cairo, Egypt',
    },
  ]);

  // Create nurse profiles
  console.log('📋 Creating nurse profiles...');
  await nurseProfileModel.insertMany([
    {
      userId: nurses[0]._id,
      licenseNumber: 'NUR001',
      yearsOfExperience: 5,
      specializations: [SpecializationType.GENERAL, SpecializationType.GERIATRIC],
      education: 'Bachelor of Nursing, Cairo University',
      certifications: ['CPR Certified', 'First Aid'],
      hourlyRate: 50,
      bio: 'Experienced nurse specializing in elderly care and general nursing.',
      languages: ['Arabic', 'English'],
      rating: 4.8,
      totalReviews: 25,
      completedJobs: 30,
      verifiedAt: new Date(),
      verifiedBy: admin._id,
    },
    {
      userId: nurses[1]._id,
      licenseNumber: 'NUR002',
      yearsOfExperience: 8,
      specializations: [SpecializationType.PEDIATRIC, SpecializationType.ICU],
      education: 'Master of Nursing, Alexandria University',
      certifications: ['Pediatric Advanced Life Support', 'ICU Certification'],
      hourlyRate: 75,
      bio: 'Specialized pediatric and ICU nurse with extensive experience.',
      languages: ['Arabic', 'English', 'French'],
      rating: 4.9,
      totalReviews: 40,
      completedJobs: 50,
      verifiedAt: new Date(),
      verifiedBy: admin._id,
    },
    {
      userId: nurses[2]._id,
      licenseNumber: 'NUR003',
      yearsOfExperience: 3,
      specializations: [SpecializationType.GENERAL, SpecializationType.SURGICAL],
      education: 'Bachelor of Nursing, Ain Shams University',
      certifications: ['Wound Care Specialist'],
      hourlyRate: 40,
      bio: 'Dedicated nurse with focus on wound care and general nursing.',
      languages: ['Arabic', 'English'],
      rating: 0,
      totalReviews: 0,
      completedJobs: 0,
    },
  ]);

  // Create sample requests
  console.log('📝 Creating sample requests...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await requestModel.insertMany([
    {
      patientId: patients[0]._id,
      title: 'Post-surgery wound care',
      description: 'Need professional wound care after recent surgery. Requires daily dressing changes and monitoring.',
      serviceType: ServiceType.WOUND_CARE,
      status: RequestStatus.PENDING,
      location: {
        type: 'Point',
        coordinates: [31.235, 30.035],
      },
      address: 'Zamalek, Cairo, Egypt',
      scheduledDate: tomorrow,
      estimatedDuration: 2,
      urgencyLevel: 'high',
      specialRequirements: 'Patient has diabetes, requires sterile technique',
      budget: 150,
      contactPhone: '+201234567890',
      notes: 'Please call before arriving',
    },
    {
      patientId: patients[1]._id,
      nurseId: nurses[0]._id,
      title: 'Elderly care assistance',
      description: 'Daily care for elderly patient including medication administration and vital signs monitoring.',
      serviceType: ServiceType.ELDERLY_CARE,
      status: RequestStatus.ACCEPTED,
      location: {
        type: 'Point',
        coordinates: [31.240, 30.040],
      },
      address: 'Maadi, Cairo, Egypt',
      scheduledDate: nextWeek,
      estimatedDuration: 4,
      urgencyLevel: 'medium',
      specialRequirements: 'Patient has mobility issues',
      budget: 200,
      contactPhone: '+201234567891',
      notes: 'Family will be present during visit',
      acceptedAt: new Date(),
    },
    {
      patientId: patients[0]._id,
      nurseId: nurses[1]._id,
      title: 'Medication administration',
      description: 'Weekly medication administration and health monitoring for chronic condition.',
      serviceType: ServiceType.MEDICATION_ADMINISTRATION,
      status: RequestStatus.COMPLETED,
      location: {
        type: 'Point',
        coordinates: [31.235, 30.035],
      },
      address: 'Zamalek, Cairo, Egypt',
      scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      estimatedDuration: 1,
      urgencyLevel: 'low',
      budget: 75,
      contactPhone: '+201234567890',
      acceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('👤 Admin: admin@nurseplatform.com / admin123');
  console.log('👩‍⚕️ Nurses: sara@example.com, mona@example.com, nour@example.com / nurse123');
  console.log('🤒 Patients: ahmed@example.com, fatma@example.com / patient123');
  console.log('');
  console.log('📊 Sample Data Created:');
  console.log('• 1 Admin user');
  console.log('• 3 Nurses (2 verified, 1 pending)');
  console.log('• 2 Patients');
  console.log('• 3 Nurse profiles');
  console.log('• 3 Service requests (1 pending, 1 accepted, 1 completed)');
  console.log('');
  console.log('🚀 Start the server with: npm run dev:backend');
  console.log('📚 API Documentation: http://localhost:3001/api/docs');

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
