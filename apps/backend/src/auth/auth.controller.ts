import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto, UpdateProfileDto, UserResponseDto } from '../dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with role-based registration (patient, nurse, or admin)'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors'
  })
  @ApiConflictResponse({
    description: 'User with this email already exists'
  })
  async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return JWT access token'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve the authenticated user\'s profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update the authenticated user\'s profile information'
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async updateProfile(@Body(ValidationPipe) updateData: UpdateProfileDto, @Request() req: any) {
    return this.authService.updateProfile(req.user, updateData);
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify user email address using the token sent via email'
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            isEmailVerified: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification token'
  })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Resend email verification link to user\'s email address'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' }
      },
      required: ['email']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Verification email sent successfully' }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Email is already verified or user not found'
  })
  async resendVerificationEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }
}
