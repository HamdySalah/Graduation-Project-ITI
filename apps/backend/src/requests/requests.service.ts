import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { UserDocument, UserRole } from '../schemas/user.schema';
import { CreateRequestDto, UpdateRequestStatusDto } from '../dto/request.dto';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
  ) {}

  async createRequest(createRequestDto: CreateRequestDto, patientUser: UserDocument) {
    this.logger.log(`Request creation attempt by user: ${patientUser._id}`);

    try {
      // Ensure only patients can create requests
      if (patientUser.role !== UserRole.PATIENT) {
        throw new ForbiddenException('Only patients can create service requests');
      }

      // Validate scheduled date is in the future
      const scheduledDate = new Date(createRequestDto.scheduledDate);
      if (scheduledDate <= new Date()) {
        throw new BadRequestException('Scheduled date must be in the future');
      }

      // Validate coordinates
      const [longitude, latitude] = createRequestDto.coordinates;
      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        throw new BadRequestException('Invalid coordinates provided');
      }

      const { coordinates, ...requestData } = createRequestDto;

      const request = new this.requestModel({
        ...requestData,
        patientId: patientUser._id,
        location: {
          type: 'Point',
          coordinates: coordinates, // [longitude, latitude]
        },
        scheduledDate,
        status: RequestStatus.PENDING,
      });

      const savedRequest = await request.save();
      this.logger.log(`Request created successfully: ${savedRequest._id}`);

      // Populate patient information
      await savedRequest.populate('patientId', '-password');

      return {
        id: savedRequest._id,
        title: savedRequest.title,
        description: savedRequest.description,
        serviceType: savedRequest.serviceType,
        status: savedRequest.status,
        location: savedRequest.location,
        address: savedRequest.address,
        scheduledDate: savedRequest.scheduledDate,
        estimatedDuration: savedRequest.estimatedDuration,
        urgencyLevel: savedRequest.urgencyLevel,
        specialRequirements: savedRequest.specialRequirements,
        budget: savedRequest.budget,
        contactPhone: savedRequest.contactPhone,
        notes: savedRequest.notes,
        createdAt: savedRequest.createdAt || new Date(),
        updatedAt: savedRequest.updatedAt || new Date(),
        patient: {
          id: (savedRequest.patientId as any)._id,
          name: (savedRequest.patientId as any).name,
          phone: (savedRequest.patientId as any).phone,
        },
      };
    } catch (error) {
      this.logger.error(`Request creation failed for user ${patientUser._id}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getRequests(user: UserDocument, status?: RequestStatus) {
    let query: any = {};

    // Filter based on user role
    if (user.role === UserRole.PATIENT) {
      query.patientId = user._id as any;
    } else if (user.role === UserRole.NURSE) {
      // Nurses can see requests assigned to them or available requests
      query = {
        $or: [
          { nurseId: user._id as any },
          { status: RequestStatus.PENDING }
        ]
      };
    } else if (user.role === UserRole.ADMIN) {
      // Admins can see all requests
    }

    if (status) {
      query.status = status;
    }

    const requests = await this.requestModel
      .find(query)
      .populate('patientId', '-password')
      .populate('nurseId', '-password')
      .sort({ createdAt: -1 })
      .exec();

    return requests.map(request => ({
      id: request._id,
      title: request.title,
      description: request.description,
      serviceType: request.serviceType,
      status: request.status,
      location: request.location,
      address: request.address,
      scheduledDate: request.scheduledDate,
      estimatedDuration: request.estimatedDuration,
      urgencyLevel: request.urgencyLevel,
      specialRequirements: request.specialRequirements,
      budget: request.budget,
      contactPhone: request.contactPhone,
      notes: request.notes,
      createdAt: request.createdAt,
      acceptedAt: request.acceptedAt,
      completedAt: request.completedAt,
      patient: request.patientId ? {
        id: (request.patientId as any)._id,
        name: (request.patientId as any).name,
        phone: (request.patientId as any).phone,
        email: (request.patientId as any).email,
      } : null,
      nurse: request.nurseId ? {
        id: (request.nurseId as any)._id,
        name: (request.nurseId as any).name,
        phone: (request.nurseId as any).phone,
        email: (request.nurseId as any).email,
      } : null,
    }));
  }

  // Temporary method for admin access without authentication
  async getAllRequestsForAdmin(status?: RequestStatus) {
    let query: any = {};

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    try {
      const requests = await this.requestModel
        .find(query)
        .populate('patientId', '-password')
        .populate('nurseId', '-password')
        .sort({ createdAt: -1 })
        .limit(20) // Limit to 20 most recent requests for performance
        .exec();

      this.logger.log(`Retrieved ${requests.length} requests for admin view`);

      return requests.map(request => ({
        id: request._id,
        title: request.title,
        description: request.description,
        serviceType: request.serviceType,
        status: request.status,
        location: request.location,
        address: request.address,
        scheduledDate: request.scheduledDate,
        estimatedDuration: request.estimatedDuration,
        urgencyLevel: request.urgencyLevel,
        specialRequirements: request.specialRequirements,
        budget: request.budget,
        contactPhone: request.contactPhone,
        notes: request.notes,
        createdAt: request.createdAt,
        acceptedAt: request.acceptedAt,
        completedAt: request.completedAt,
        patient: request.patientId ? {
          id: (request.patientId as any)._id,
          name: (request.patientId as any).name,
          phone: (request.patientId as any).phone,
          email: (request.patientId as any).email,
        } : null,
        nurse: request.nurseId ? {
          id: (request.nurseId as any)._id,
          name: (request.nurseId as any).name,
          phone: (request.nurseId as any).phone,
          email: (request.nurseId as any).email,
        } : null,
      }));
    } catch (error) {
      this.logger.error(`Failed to retrieve requests for admin:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getRequestById(requestId: string, user: UserDocument) {
    const request = await this.requestModel
      .findById(requestId)
      .populate('patientId', '-password')
      .populate('nurseId', '-password')
      .exec();

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check permissions
    const canView =
      user.role === UserRole.ADMIN ||
      request.patientId._id.equals(user._id as any) ||
      (request.nurseId && request.nurseId._id.equals(user._id as any));

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this request');
    }

    return {
      id: request._id,
      title: request.title,
      description: request.description,
      serviceType: request.serviceType,
      status: request.status,
      location: request.location,
      address: request.address,
      scheduledDate: request.scheduledDate,
      estimatedDuration: request.estimatedDuration,
      urgencyLevel: request.urgencyLevel,
      specialRequirements: request.specialRequirements,
      budget: request.budget,
      contactPhone: request.contactPhone,
      notes: request.notes,
      patient: {
        id: request.patientId._id,
        name: (request.patientId as any).name,
        email: (request.patientId as any).email,
        phone: (request.patientId as any).phone,
        address: (request.patientId as any).address,
      },
      nurse: request.nurseId ? {
        id: request.nurseId._id,
        name: (request.nurseId as any).name,
        email: (request.nurseId as any).email,
        phone: (request.nurseId as any).phone,
        address: (request.nurseId as any).address,
      } : null,
      createdAt: request.createdAt || new Date(),
      acceptedAt: request.acceptedAt,
      completedAt: request.completedAt,
      cancelledAt: request.cancelledAt,
      cancellationReason: request.cancellationReason,
    };
  }

  async updateRequestStatus(requestId: string, updateStatusDto: UpdateRequestStatusDto, user: UserDocument) {
    const request = await this.requestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const { status, cancellationReason } = updateStatusDto;

    // Validate status transitions and permissions
    if (status === RequestStatus.ACCEPTED) {
      if (user.role !== UserRole.NURSE) {
        throw new ForbiddenException('Only nurses can accept requests');
      }
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be accepted');
      }
      request.nurseId = user._id as any;
      request.acceptedAt = new Date();
    } else if (status === RequestStatus.COMPLETED) {
      if (user.role !== UserRole.NURSE || !request.nurseId?.equals(user._id as any)) {
        throw new ForbiddenException('Only the assigned nurse can complete requests');
      }
      if (request.status !== RequestStatus.IN_PROGRESS && request.status !== RequestStatus.ACCEPTED) {
        throw new BadRequestException('Only in-progress or accepted requests can be completed');
      }
      request.completedAt = new Date();
    } else if (status === RequestStatus.CANCELLED) {
      if (user.role !== UserRole.PATIENT || !request.patientId.equals(user._id as any)) {
        throw new ForbiddenException('Only the patient can cancel their requests');
      }
      request.cancelledAt = new Date();
      request.cancellationReason = cancellationReason;
    } else if (status === RequestStatus.IN_PROGRESS) {
      if (user.role !== UserRole.NURSE || !request.nurseId?.equals(user._id as any)) {
        throw new ForbiddenException('Only the assigned nurse can start requests');
      }
      if (request.status !== RequestStatus.ACCEPTED) {
        throw new BadRequestException('Only accepted requests can be started');
      }
    }

    if (!status) {
      throw new BadRequestException('Status is required');
    }
    request.status = status;
    await request.save();

    return {
      message: 'Request status updated successfully',
      request: {
        id: request._id,
        status: request.status,
        acceptedAt: request.acceptedAt,
        completedAt: request.completedAt,
        cancelledAt: request.cancelledAt,
      },
    };
  }

  async getDashboardStats(user: UserDocument) {
    const stats: any = {};

    if (user.role === UserRole.PATIENT) {
      // Patient dashboard stats
      const totalRequests = await this.requestModel.countDocuments({ patientId: user._id }).exec();
      const pendingRequests = await this.requestModel.countDocuments({
        patientId: user._id,
        status: RequestStatus.PENDING
      }).exec();
      const acceptedRequests = await this.requestModel.countDocuments({
        patientId: user._id,
        status: RequestStatus.ACCEPTED
      }).exec();
      const completedRequests = await this.requestModel.countDocuments({
        patientId: user._id,
        status: RequestStatus.COMPLETED
      }).exec();

      stats.patient = {
        totalRequests,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        cancelledRequests: totalRequests - pendingRequests - acceptedRequests - completedRequests,
      };

    } else if (user.role === UserRole.NURSE) {
      // Nurse dashboard stats
      const totalAssignedRequests = await this.requestModel.countDocuments({ nurseId: user._id }).exec();
      const completedRequests = await this.requestModel.countDocuments({
        nurseId: user._id,
        status: RequestStatus.COMPLETED
      }).exec();
      const activeRequests = await this.requestModel.countDocuments({
        nurseId: user._id,
        status: RequestStatus.ACCEPTED
      }).exec();
      const availableRequests = await this.requestModel.countDocuments({
        status: RequestStatus.PENDING
      }).exec();

      stats.nurse = {
        totalAssignedRequests,
        completedRequests,
        activeRequests,
        availableRequests,
        completionRate: totalAssignedRequests > 0 ? Math.round((completedRequests / totalAssignedRequests) * 100) : 0,
      };

    } else if (user.role === UserRole.ADMIN) {
      // Admin dashboard stats
      const totalRequests = await this.requestModel.countDocuments().exec();
      const pendingRequests = await this.requestModel.countDocuments({ status: RequestStatus.PENDING }).exec();
      const completedRequests = await this.requestModel.countDocuments({ status: RequestStatus.COMPLETED }).exec();

      // Import User model for admin stats
      const User = this.requestModel.db.model('User');
      const totalUsers = await User.countDocuments().exec();
      const totalNurses = await User.countDocuments({ role: UserRole.NURSE }).exec();
      const pendingNurses = await User.countDocuments({
        role: UserRole.NURSE,
        status: 'pending'
      }).exec();

      stats.admin = {
        totalRequests,
        pendingRequests,
        completedRequests,
        totalUsers,
        totalNurses,
        pendingNurses,
        activeRequests: await this.requestModel.countDocuments({ status: RequestStatus.ACCEPTED }).exec(),
      };
    }

    return stats;
  }
}
