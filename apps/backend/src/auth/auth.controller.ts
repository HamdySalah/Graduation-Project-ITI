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
  ValidationPipe
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
}
