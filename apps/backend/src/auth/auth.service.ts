import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { NurseProfile, NurseProfileDocument } from '../schemas/nurse-profile.schema';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto/auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, role, coordinates, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new this.userModel({
      ...userData,
      email,
      password: hashedPassword,
      role,
      location: {
        type: 'Point',
        coordinates: coordinates, // [longitude, latitude]
      },
    });

    const savedUser = await user.save();

    // If user is a nurse, create nurse profile
    if (role === UserRole.NURSE) {
      if (!registerDto.licenseNumber || !registerDto.yearsOfExperience) {
        throw new BadRequestException('License number and years of experience are required for nurses');
      }

      const nurseProfile = new this.nurseProfileModel({
        userId: savedUser._id,
        licenseNumber: registerDto.licenseNumber,
        yearsOfExperience: registerDto.yearsOfExperience,
        specializations: registerDto.specializations || [],
        education: registerDto.education,
        certifications: registerDto.certifications || [],
        documents: registerDto.documents || [],
        hourlyRate: registerDto.hourlyRate,
        bio: registerDto.bio,
        languages: registerDto.languages || [],
      });

      await nurseProfile.save();

      // Send welcome email to nurse
      try {
        await this.emailService.sendWelcomeEmail(email, userData.name);
        console.log(`Welcome email sent to nurse: ${email}`);
      } catch (error) {
        // Log error but don't fail registration
        console.error('Failed to send welcome email:', error);
      }
    }

    // Generate JWT token
    const payload = { email: savedUser.email, sub: savedUser._id, role: savedUser.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { email: user.email, sub: user._id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).exec();
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async getProfile(user: UserDocument) {
    const userProfile = await this.userModel
      .findById(user._id)
      .select('-password')
      .exec();

    if (!userProfile) {
      throw new UnauthorizedException('User not found');
    }

    let profile: any = {
      id: userProfile._id.toString(),
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      role: userProfile.role,
      status: userProfile.status,
      location: userProfile.location,
      address: userProfile.address,
      profileImage: userProfile.profileImage,
      createdAt: userProfile.createdAt,
    };

    // If user is a nurse, include nurse profile data
    if (user.role === UserRole.NURSE) {
      const nurseProfile = await this.nurseProfileModel
        .findOne({ userId: user._id })
        .exec();

      if (nurseProfile) {
        profile = {
          ...profile,
          licenseNumber: nurseProfile.licenseNumber,
          yearsOfExperience: nurseProfile.yearsOfExperience,
          specializations: nurseProfile.specializations,
          education: nurseProfile.education,
          certifications: nurseProfile.certifications,
          rating: nurseProfile.rating,
          totalReviews: nurseProfile.totalReviews,
          completedJobs: nurseProfile.completedJobs,
          hourlyRate: nurseProfile.hourlyRate,
          bio: nurseProfile.bio,
          languages: nurseProfile.languages,
          isAvailable: nurseProfile.isAvailable,
          documents: nurseProfile.documents,
        };
      }
    }

    return profile;
  }

  async updateProfile(user: UserDocument, updateData: any) {
    const { coordinates, nurseData, ...userData } = updateData;

    // Update user data
    const updateUserData: any = { ...userData };
    if (coordinates) {
      updateUserData.location = {
        type: 'Point',
        coordinates: coordinates,
      };
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(user._id, updateUserData, { new: true })
      .select('-password')
      .exec();

    // If user is a nurse and nurse data is provided, update nurse profile
    if (user.role === UserRole.NURSE && nurseData) {
      await this.nurseProfileModel
        .findOneAndUpdate(
          { userId: user._id },
          nurseData,
          { new: true, upsert: true }
        )
        .exec();
    }

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }
}
