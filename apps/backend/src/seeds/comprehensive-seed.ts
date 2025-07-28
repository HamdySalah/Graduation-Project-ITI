import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../schemas/user.schema';
import { NurseProfile, SpecializationType } from '../schemas/nurse-profile.schema';
import { PatientRequest, RequestStatus, ServiceType } from '../schemas/patient-request.schema';
import { Review, ReviewType, ReviewerRole } from '../schemas/review.schema';
import { Application, ApplicationStatus } from '../schemas/application.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get models
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const nurseProfileModel = app.get<Model<NurseProfile>>(getModelToken(NurseProfile.name));
  const requestModel = app.get<Model<PatientRequest>>(getModelToken(PatientRequest.name));
  const reviewModel = app.get<Model<Review>>(getModelToken(Review.name));
  const applicationModel = app.get<Model<Application>>(getModelToken(Application.name));

  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      userModel.deleteMany({}),
      nurseProfileModel.deleteMany({}),
      requestModel.deleteMany({}),
      reviewModel.deleteMany({}),
      applicationModel.deleteMany({}),
    ]);

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Admin Users
    console.log('👑 Creating admin users...');
    const adminUsers = await userModel.insertMany([
      {
        name: 'System Administrator',
        email: 'admin@careconnect.com',
        password: hashedPassword,
        phone: '+201000000000',
        role: UserRole.ADMIN,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444] // Cairo, Egypt
        },
        address: 'CareConnect Headquarters, New Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.admin@careconnect.com',
        password: hashedPassword,
        phone: '+201000000001',
        role: UserRole.ADMIN,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        },
        address: 'CareConnect Operations, New Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      }
    ]);

    // 2. Create Patient Users
    console.log('🏥 Creating patient users...');
    const patients = await userModel.insertMany([
      {
        name: 'Ahmed Hassan',
        email: 'patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111111',
        role: UserRole.PATIENT,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444] // Cairo
        },
        address: '123 Tahrir Square, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Fatima Al-Zahra',
        email: 'fatima.patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111112',
        role: UserRole.PATIENT,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2001, 29.9187] // Giza
        },
        address: '456 Pyramid Street, Giza, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Omar Mahmoud',
        email: 'omar.patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111113',
        role: UserRole.PATIENT,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2461, 30.0588] // Heliopolis
        },
        address: '789 Korba Street, Heliopolis, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Maryam Ibrahim',
        email: 'maryam.patient@gmail.com',
        password: hashedPassword,
        phone: '+201111111114',
        role: UserRole.PATIENT,
        status: UserStatus.PENDING,
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        },
        address: '321 Maadi Street, Maadi, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
      }
    ]);

    // 3. Create Nurse Users
    console.log('👩‍⚕️ Creating nurse users...');
    const nurses = await userModel.insertMany([
      {
        name: 'Dr. Amira Mostafa',
        email: 'nurse@gmail.com',
        password: hashedPassword,
        phone: '+201222222221',
        role: UserRole.NURSE,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        },
        address: '100 Medical District, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Nurse Yasmin Ali',
        email: 'yasmin.nurse@gmail.com',
        password: hashedPassword,
        phone: '+201222222222',
        role: UserRole.NURSE,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2001, 29.9187]
        },
        address: '200 Healthcare Avenue, Giza, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Nurse Khaled Farouk',
        email: 'khaled.nurse@gmail.com',
        password: hashedPassword,
        phone: '+201222222223',
        role: UserRole.NURSE,
        status: UserStatus.VERIFIED,
        location: {
          type: 'Point',
          coordinates: [31.2461, 30.0588]
        },
        address: '300 Nursing Plaza, Heliopolis, Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Dr. Nour Hassan',
        email: 'nour.nurse@gmail.com',
        password: hashedPassword,
        phone: '+201222222224',
        role: UserRole.NURSE,
        status: UserStatus.PENDING,
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444]
        },
        address: '400 Medical Center, New Cairo, Egypt',
        profileImage: 'https://images.unsplash.com/photo-1594824388853-d0c2d4e8e0e5?w=150&h=150&fit=crop&crop=face'
      }
    ]);

    // 4. Create Nurse Profiles
    console.log('📋 Creating nurse profiles...');
    const nurseProfiles = await nurseProfileModel.insertMany([
      {
        userId: nurses[0]._id,
        licenseNumber: 'RN-EG-001234',
        specializations: [SpecializationType.WOUND_CARE, SpecializationType.HOME_CARE],
        experience: 8,
        education: 'Bachelor of Nursing, Cairo University',
        certifications: ['Wound Care Specialist', 'Home Healthcare Certified'],
        languages: ['Arabic', 'English'],
        availability: {
          monday: { available: true, startTime: '08:00', endTime: '18:00' },
          tuesday: { available: true, startTime: '08:00', endTime: '18:00' },
          wednesday: { available: true, startTime: '08:00', endTime: '18:00' },
          thursday: { available: true, startTime: '08:00', endTime: '18:00' },
          friday: { available: true, startTime: '08:00', endTime: '16:00' },
          saturday: { available: false },
          sunday: { available: false }
        },
        hourlyRate: 150,
        rating: 4.8,
        totalReviews: 45,
        bio: 'Experienced registered nurse specializing in wound care and home healthcare services.',
        isVerified: true
      },
      {
        userId: nurses[1]._id,
        licenseNumber: 'RN-EG-001235',
        specializations: [SpecializationType.ELDERLY_CARE, SpecializationType.MEDICATION_ADMINISTRATION],
        experience: 5,
        education: 'Bachelor of Nursing, Alexandria University',
        certifications: ['Geriatric Care Specialist', 'Medication Management'],
        languages: ['Arabic', 'English', 'French'],
        availability: {
          monday: { available: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
          thursday: { available: true, startTime: '09:00', endTime: '17:00' },
          friday: { available: true, startTime: '09:00', endTime: '15:00' },
          saturday: { available: true, startTime: '10:00', endTime: '14:00' },
          sunday: { available: false }
        },
        hourlyRate: 120,
        rating: 4.6,
        totalReviews: 32,
        bio: 'Compassionate nurse with expertise in elderly care and medication management.',
        isVerified: true
      },
      {
        userId: nurses[2]._id,
        licenseNumber: 'RN-EG-001236',
        specializations: [SpecializationType.POST_SURGICAL_CARE, SpecializationType.VITAL_SIGNS_MONITORING],
        experience: 12,
        education: 'Master of Nursing, Ain Shams University',
        certifications: ['Post-Surgical Care Specialist', 'Critical Care Certified'],
        languages: ['Arabic', 'English'],
        availability: {
          monday: { available: true, startTime: '06:00', endTime: '18:00' },
          tuesday: { available: true, startTime: '06:00', endTime: '18:00' },
          wednesday: { available: true, startTime: '06:00', endTime: '18:00' },
          thursday: { available: true, startTime: '06:00', endTime: '18:00' },
          friday: { available: true, startTime: '06:00', endTime: '18:00' },
          saturday: { available: true, startTime: '08:00', endTime: '16:00' },
          sunday: { available: true, startTime: '08:00', endTime: '16:00' }
        },
        hourlyRate: 200,
        rating: 4.9,
        totalReviews: 67,
        bio: 'Senior nurse with extensive experience in post-surgical care and patient monitoring.',
        isVerified: true
      }
    ]);

    console.log('✅ Seed data created successfully!');
    console.log(`👑 Admin users: ${adminUsers.length}`);
    console.log(`🏥 Patients: ${patients.length}`);
    console.log(`👩‍⚕️ Nurses: ${nurses.length}`);
    console.log(`📋 Nurse profiles: ${nurseProfiles.length}`);

    // Store IDs for next part
    console.log('\n📝 User credentials for testing:');
    console.log('='.repeat(50));
    console.log('ADMIN ACCOUNTS:');
    console.log('Email: admin@careconnect.com | Password: password123');
    console.log('Email: sarah.admin@careconnect.com | Password: password123');
    console.log('\nPATIENT ACCOUNTS:');
    console.log('Email: patient@gmail.com | Password: password123');
    console.log('Email: fatima.patient@gmail.com | Password: password123');
    console.log('Email: omar.patient@gmail.com | Password: password123');
    console.log('\nNURSE ACCOUNTS:');
    console.log('Email: nurse@gmail.com | Password: password123');
    console.log('Email: yasmin.nurse@gmail.com | Password: password123');
    console.log('Email: khaled.nurse@gmail.com | Password: password123');
    console.log('='.repeat(50));

    // Continue with requests, applications, and reviews
    await seedRequestsAndReviews(requestModel, applicationModel, reviewModel, patients, nurses);

    return { adminUsers, patients, nurses, nurseProfiles };

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

async function seedRequestsAndReviews(
  requestModel: Model<PatientRequest>,
  applicationModel: Model<Application>,
  reviewModel: Model<Review>,
  patients: any[],
  nurses: any[]
) {
  console.log('📋 Creating patient requests...');

  // Create various requests with different statuses
  const requests = await requestModel.insertMany([
    // Completed request with reviews
    {
      patientId: patients[0]._id,
      nurseId: nurses[0]._id,
      title: 'Post-Surgery Wound Care',
      description: 'Need professional wound care after knee surgery. Dressing changes and monitoring required.',
      serviceType: ServiceType.WOUND_CARE,
      status: RequestStatus.COMPLETED,
      location: {
        type: 'Point',
        coordinates: [31.2357, 30.0444]
      },
      address: '123 Tahrir Square, Cairo, Egypt',
      scheduledDate: new Date('2024-01-15T10:00:00Z'),
      estimatedDuration: 2,
      urgencyLevel: 'high',
      specialRequirements: 'Sterile technique required, patient has diabetes',
      budget: 300,
      contactPhone: '+201111111111',
      notes: 'Patient is elderly and needs gentle care',
      acceptedAt: new Date('2024-01-10T08:00:00Z'),
      completedAt: new Date('2024-01-15T12:00:00Z'),
      nurseCompleted: true,
      nurseCompletedAt: new Date('2024-01-15T12:00:00Z'),
      patientCompleted: true,
      patientCompletedAt: new Date('2024-01-15T12:30:00Z')
    },
    // In progress request
    {
      patientId: patients[1]._id,
      nurseId: nurses[1]._id,
      title: 'Elderly Care Assistance',
      description: 'Daily care assistance for elderly mother including medication management.',
      serviceType: ServiceType.ELDERLY_CARE,
      status: RequestStatus.IN_PROGRESS,
      location: {
        type: 'Point',
        coordinates: [31.2001, 29.9187]
      },
      address: '456 Pyramid Street, Giza, Egypt',
      scheduledDate: new Date('2024-01-20T09:00:00Z'),
      estimatedDuration: 4,
      urgencyLevel: 'medium',
      specialRequirements: 'Patient has mild dementia, needs patient approach',
      budget: 400,
      contactPhone: '+201111111112',
      notes: 'Morning care preferred',
      acceptedAt: new Date('2024-01-18T10:00:00Z')
    },
    // Pending request
    {
      patientId: patients[2]._id,
      title: 'Medication Administration',
      description: 'Need help with daily insulin injections and blood sugar monitoring.',
      serviceType: ServiceType.MEDICATION_ADMINISTRATION,
      status: RequestStatus.PENDING,
      location: {
        type: 'Point',
        coordinates: [31.2461, 30.0588]
      },
      address: '789 Korba Street, Heliopolis, Cairo, Egypt',
      scheduledDate: new Date('2024-01-25T08:00:00Z'),
      estimatedDuration: 1,
      urgencyLevel: 'high',
      specialRequirements: 'Diabetic patient, needs experienced nurse',
      budget: 200,
      contactPhone: '+201111111113',
      notes: 'Prefer morning appointments'
    },
    // Another completed request for reviews
    {
      patientId: patients[1]._id,
      nurseId: nurses[2]._id,
      title: 'Post-Surgical Monitoring',
      description: 'Vital signs monitoring after cardiac surgery.',
      serviceType: ServiceType.POST_SURGICAL_CARE,
      status: RequestStatus.COMPLETED,
      location: {
        type: 'Point',
        coordinates: [31.2001, 29.9187]
      },
      address: '456 Pyramid Street, Giza, Egypt',
      scheduledDate: new Date('2024-01-12T14:00:00Z'),
      estimatedDuration: 3,
      urgencyLevel: 'high',
      specialRequirements: 'Cardiac monitoring equipment needed',
      budget: 500,
      contactPhone: '+201111111112',
      notes: 'Patient recovering from heart surgery',
      acceptedAt: new Date('2024-01-10T09:00:00Z'),
      completedAt: new Date('2024-01-12T17:00:00Z'),
      nurseCompleted: true,
      nurseCompletedAt: new Date('2024-01-12T17:00:00Z'),
      patientCompleted: true,
      patientCompletedAt: new Date('2024-01-12T17:30:00Z')
    }
  ]);

  console.log('📝 Creating applications...');

  // Create applications for pending request
  const applications = await applicationModel.insertMany([
    {
      requestId: requests[2]._id, // Pending request
      nurseId: nurses[0]._id,
      price: 180,
      estimatedTime: 1,
      status: ApplicationStatus.PENDING
    },
    {
      requestId: requests[2]._id, // Pending request
      nurseId: nurses[1]._id,
      price: 200,
      estimatedTime: 1.5,
      status: ApplicationStatus.PENDING
    }
  ]);

  console.log('⭐ Creating reviews...');

  // Create reviews for completed requests
  const reviews = await reviewModel.insertMany([
    // Patient reviewing nurse (user-to-user)
    {
      requestId: requests[0]._id,
      reviewerId: patients[0]._id,
      reviewerRole: ReviewerRole.PATIENT,
      revieweeId: nurses[0]._id,
      reviewType: ReviewType.USER_TO_USER,
      rating: 5,
      feedback: 'Dr. Amira was absolutely wonderful! Very professional, gentle, and knowledgeable. She took great care of my wound and explained everything clearly. Highly recommended!',
      submittedAt: new Date('2024-01-15T13:00:00Z')
    },
    // Nurse reviewing patient (user-to-user)
    {
      requestId: requests[0]._id,
      reviewerId: nurses[0]._id,
      reviewerRole: ReviewerRole.NURSE,
      revieweeId: patients[0]._id,
      reviewType: ReviewType.USER_TO_USER,
      rating: 5,
      feedback: 'Ahmed was a very cooperative patient. He followed all instructions carefully and was very respectful. Easy to work with.',
      submittedAt: new Date('2024-01-15T13:30:00Z')
    },
    // Patient reviewing service
    {
      requestId: requests[0]._id,
      reviewerId: patients[0]._id,
      reviewerRole: ReviewerRole.PATIENT,
      reviewType: ReviewType.SERVICE_REVIEW,
      rating: 5,
      feedback: 'Excellent service overall! The platform made it easy to find a qualified nurse, and the booking process was smooth.',
      submittedAt: new Date('2024-01-15T14:00:00Z')
    },
    // Nurse reviewing service
    {
      requestId: requests[0]._id,
      reviewerId: nurses[0]._id,
      reviewerRole: ReviewerRole.NURSE,
      reviewType: ReviewType.SERVICE_REVIEW,
      rating: 4,
      feedback: 'Good platform for connecting with patients. The interface is user-friendly and payment processing is reliable.',
      submittedAt: new Date('2024-01-15T14:30:00Z')
    },
    // Reviews for second completed request
    {
      requestId: requests[3]._id,
      reviewerId: patients[1]._id,
      reviewerRole: ReviewerRole.PATIENT,
      revieweeId: nurses[2]._id,
      reviewType: ReviewType.USER_TO_USER,
      rating: 5,
      feedback: 'Nurse Khaled was exceptional! His expertise in post-surgical care was evident. Very professional and caring.',
      submittedAt: new Date('2024-01-12T18:00:00Z')
    },
    {
      requestId: requests[3]._id,
      reviewerId: nurses[2]._id,
      reviewerRole: ReviewerRole.NURSE,
      revieweeId: patients[1]._id,
      reviewType: ReviewType.USER_TO_USER,
      rating: 4,
      feedback: 'Fatima was a good patient who followed post-surgery instructions well. Family was very supportive.',
      submittedAt: new Date('2024-01-12T18:30:00Z')
    },
    {
      requestId: requests[3]._id,
      reviewerId: patients[1]._id,
      reviewerRole: ReviewerRole.PATIENT,
      reviewType: ReviewType.SERVICE_REVIEW,
      rating: 4,
      feedback: 'Great service for finding specialized nurses. Would recommend to others needing medical care at home.',
      submittedAt: new Date('2024-01-12T19:00:00Z')
    }
  ]);

  console.log(`📋 Requests created: ${requests.length}`);
  console.log(`📝 Applications created: ${applications.length}`);
  console.log(`⭐ Reviews created: ${reviews.length}`);
}

if (require.main === module) {
  bootstrap()
    .then(() => {
      console.log('🎉 Database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database seeding failed:', error);
      process.exit(1);
    });
}

export { bootstrap };
