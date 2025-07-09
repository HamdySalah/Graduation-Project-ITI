import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { NurseProfile, NurseProfileDocument } from '../schemas/nurse-profile.schema';
import { RegisterDto, LoginDto, AuthResponseDto, UpdateProfileDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(NurseProfile.name) private nurseProfileModel: Model<NurseProfileDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, role, coordinates, ...userData } = registerDto;

    this.logger.log(`Registration attempt for email: ${email}, role: ${role}`);

    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        this.logger.warn(`Registration failed: User with email ${email} already exists`);
        throw new ConflictException('User with this email already exists');
      }

      // Validate nurse-specific requirements
      if (role === UserRole.NURSE) {
        if (!registerDto.licenseNumber || registerDto.yearsOfExperience === undefined) {
          throw new BadRequestException('License number and years of experience are required for nurses');
        }
        if (registerDto.yearsOfExperience < 0 || registerDto.yearsOfExperience > 50) {
          throw new BadRequestException('Years of experience must be between 0 and 50');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = new this.userModel({
        ...userData,
        email,
        password: hashedPassword,
        role,
status: (role.toLowerCase() === UserRole.ADMIN.toLowerCase() || role.toLowerCase() === UserRole.PATIENT.toLowerCase()) 
  ? UserStatus.VERIFIED 
  : UserStatus.PENDING,        location: {
          type: 'Point',
          coordinates: coordinates, // [longitude, latitude]
        },
      });

      const savedUser = await user.save();
      this.logger.log(`User created successfully: ${savedUser._id}`);

      // If user is a nurse, create nurse profile
      if (role === UserRole.NURSE) {
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
          isAvailable: false, // New nurses start as unavailable until verified
        });

        await nurseProfile.save();
        this.logger.log(`Nurse profile created for user: ${savedUser._id}`);
      }

      // Generate JWT token
      const payload = {
        email: savedUser.email,
        sub: savedUser._id,
        role: savedUser.role
      };
      const access_token = this.jwtService.sign(payload);

      this.logger.log(`Registration successful for user: ${savedUser._id}`);

      return {
        access_token,
        user: {
          id: (savedUser._id as any).toString(),
          name: savedUser.name!,
          email: savedUser.email!,
          role: savedUser.role!,
          status: savedUser.status!,
        },
      };
    } catch (error) {
      this.logger.error(`Registration failed for email ${email}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for email: ${email}`);

    try {
      // Find user by email
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        this.logger.warn(`Login failed: User not found for email ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if account is not rejected
      if (user.status === UserStatus.REJECTED) {
        this.logger.warn(`Login failed: Account rejected for email ${email}`);
        throw new UnauthorizedException('Account has been rejected. Please contact support.');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password!);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for email ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload = {
        email: user.email,
        sub: user._id,
        role: user.role
      };
      const access_token = this.jwtService.sign(payload);

      this.logger.log(`Login successful for user: ${user._id}`);

      return {
        access_token,
        user: {
          id: (user._id as any).toString(),
          name: user.name!,
          email: user.email!,
          role: user.role!,
          status: user.status!,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed for email ${email}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).exec();
    if (user && user.password && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user.toObject();
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
      id: (userProfile._id as string).toString(),
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

  async updateProfile(user: UserDocument, updateData: UpdateProfileDto) {
    this.logger.log(`Profile update attempt for user: ${user._id}`);

    try {
      const { coordinates, hourlyRate, bio, isAvailable, ...userData } = updateData;

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

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      // If user is a nurse and nurse-specific data is provided, update nurse profile
      if (user.role === UserRole.NURSE && (hourlyRate !== undefined || bio !== undefined || isAvailable !== undefined)) {
        const nurseUpdateData: any = {};
        if (hourlyRate !== undefined) nurseUpdateData.hourlyRate = hourlyRate;
        if (bio !== undefined) nurseUpdateData.bio = bio;
        if (isAvailable !== undefined) nurseUpdateData.isAvailable = isAvailable;

        await this.nurseProfileModel
          .findOneAndUpdate(
            { userId: user._id },
            nurseUpdateData,
            { new: true, upsert: true }
          )
          .exec();

        this.logger.log(`Nurse profile updated for user: ${user._id}`);
      }

      this.logger.log(`Profile updated successfully for user: ${user._id}`);

      return {
        message: 'Profile updated successfully',
        user: {
          id: (updatedUser._id as string).toString(),
          name: updatedUser.name!,
          email: updatedUser.email!,
          role: updatedUser.role!,
          status: updatedUser.status!,
        },
      };
    } catch (error) {
      this.logger.error(`Profile update failed for user ${user._id}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}
