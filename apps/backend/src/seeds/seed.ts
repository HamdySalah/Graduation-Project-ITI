import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../schemas/user.schema';
import { NurseProfile, SpecializationType } from '../schemas/nurse-profile.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const nurseProfileModel = app.get<Model<NurseProfile>>(getModelToken(NurseProfile.name));

  // Clear existing data
  await userModel.deleteMany({});
  await nurseProfileModel.deleteMany({});

  // Create admin user
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
  await nurseProfileModel.insertMany([
    {
      userId: nurses[0]._id,
      licenseNumber: 'NUR001',
      yearsOfExperience: 5,
      specializations: [SpecializationType.GENERAL, SpecializationType.ELDERLY_CARE],
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
      specializations: [SpecializationType.GENERAL, SpecializationType.WOUND_CARE],
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

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin: admin@nurseplatform.com / admin123');
  console.log('🏥 Nurses: sara@example.com, mona@example.com, nour@example.com / nurse123');
  console.log('🤒 Patients: ahmed@example.com, fatma@example.com / patient123');
  
  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
