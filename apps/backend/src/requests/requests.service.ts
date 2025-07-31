import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { CreateRequestDto, UpdateRequestStatusDto, UpdateRequestDto } from '../dto/request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Helper method to safely compare ObjectIds
   * Handles cases where IDs might be strings or ObjectId instances
   */
  private compareObjectIds(id1: any, id2: any): boolean {
    if (!id1 || !id2) return false;

    // Convert both to strings for comparison
    const str1 = id1.toString();
    const str2 = id2.toString();

    return str1 === str2;
  }

  async createRequest(createRequestDto: CreateRequestDto, patientUser: UserDocument) {
    console.log('🔍 Service createRequest called with user:', patientUser);
    console.log('🔍 User _id:', patientUser._id);
    console.log('🔍 User id:', patientUser.id);

    // Ensure only patients can create requests
    if (patientUser.role !== UserRole.PATIENT) {
      throw new ForbiddenException('Only patients can create service requests');
    }

    const { coordinates, scheduledDate, ...requestData } = createRequestDto;

    const requestPayload = {
      ...requestData,
      patientId: patientUser._id,
      location: {
        type: 'Point',
        coordinates: coordinates, // [longitude, latitude]
      },
      scheduledDate: new Date(scheduledDate || Date.now()),
    };

    console.log('🔍 Request payload patientId:', requestPayload.patientId);

    const savedRequest = await this.requestModel.create(requestPayload);

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
      patient: {
        id: (savedRequest.patientId as any)._id,
        name: (savedRequest.patientId as any).name,
        phone: (savedRequest.patientId as any).phone,
      },
    };
  }



  async getRequests(user: UserDocument, status?: RequestStatus) {
    let query: any = {};

    // Filter based on user role
    if (user.role === UserRole.PATIENT) {
      query.patientId = user._id;
    } else if (user.role === UserRole.NURSE) {
      // Nurses can see requests assigned to them or available requests
      query = {
        $or: [
          { nurseId: user._id },
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
    console.log('🔍 Authorization check:');
    console.log('🔍 User role:', user.role);
    console.log('🔍 User ID:', user._id);
    console.log('🔍 Request patientId:', (request.patientId as any)?._id || request.patientId);
    console.log('🔍 Request nurseId:', (request.nurseId as any)?._id || request.nurseId);

    const canView =
      user.role === UserRole.ADMIN ||
      this.compareObjectIds((request.patientId as any)?._id || request.patientId, user._id) ||
      (request.nurseId && this.compareObjectIds((request.nurseId as any)?._id || request.nurseId, user._id));

    console.log('🔍 Can view:', canView);

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

  async updateRequest(requestId: string, updateRequestDto: UpdateRequestDto, user: UserDocument) {
    console.log('🔍 Service updateRequest called with user:', user);
    console.log('🔍 updateRequestDto:', updateRequestDto);

    const request = await this.requestModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Only the patient who created the request can edit it
    if (user.role !== UserRole.PATIENT || !this.compareObjectIds(request.patientId, user._id)) {
      throw new ForbiddenException('You can only edit your own requests');
    }

    // Only allow editing of pending requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be edited');
    }

    // Prepare update data
    const updateData: any = {};

    // Update basic fields
    if (updateRequestDto.title !== undefined) {
      updateData.title = updateRequestDto.title;
    }
    if (updateRequestDto.description !== undefined) {
      updateData.description = updateRequestDto.description;
    }
    if (updateRequestDto.serviceType !== undefined) {
      updateData.serviceType = updateRequestDto.serviceType;
    }
    if (updateRequestDto.address !== undefined) {
      updateData.address = updateRequestDto.address;
    }
    if (updateRequestDto.estimatedDuration !== undefined) {
      updateData.estimatedDuration = updateRequestDto.estimatedDuration;
    }
    if (updateRequestDto.urgencyLevel !== undefined) {
      updateData.urgencyLevel = updateRequestDto.urgencyLevel;
    }
    if (updateRequestDto.specialRequirements !== undefined) {
      updateData.specialRequirements = updateRequestDto.specialRequirements;
    }
    if (updateRequestDto.budget !== undefined) {
      updateData.budget = updateRequestDto.budget;
    }
    if (updateRequestDto.contactPhone !== undefined) {
      updateData.contactPhone = updateRequestDto.contactPhone;
    }
    if (updateRequestDto.notes !== undefined) {
      updateData.notes = updateRequestDto.notes;
    }

    // Update location if coordinates provided
    if (updateRequestDto.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: updateRequestDto.coordinates,
      };
    }

    // Update scheduled date
    if (updateRequestDto.scheduledDate) {
      updateData.scheduledDate = new Date(updateRequestDto.scheduledDate);
    }

    // Update the request
    const updatedRequest = await this.requestModel.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    ).populate('patientId', '-password').exec();

    if (!updatedRequest) {
      throw new NotFoundException('Request not found after update');
    }

    console.log('✅ Request updated successfully:', updatedRequest._id);

    return {
      message: 'Request updated successfully',
      request: {
        id: updatedRequest._id,
        title: updatedRequest.title,
        description: updatedRequest.description,
        serviceType: updatedRequest.serviceType,
        status: updatedRequest.status,
        location: updatedRequest.location,
        address: updatedRequest.address,
        scheduledDate: updatedRequest.scheduledDate,
        estimatedDuration: updatedRequest.estimatedDuration,
        urgencyLevel: updatedRequest.urgencyLevel,
        specialRequirements: updatedRequest.specialRequirements,
        budget: updatedRequest.budget,
        contactPhone: updatedRequest.contactPhone,
        notes: updatedRequest.notes,
        createdAt: updatedRequest.createdAt,
        updatedAt: updatedRequest.updatedAt,
        patient: updatedRequest.patientId ? {
          id: (updatedRequest.patientId as any)._id,
          name: (updatedRequest.patientId as any).name,
          phone: (updatedRequest.patientId as any).phone,
          email: (updatedRequest.patientId as any).email,
        } : null,
      },
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
      if (user.role !== UserRole.NURSE || !this.compareObjectIds((request.nurseId as any)?._id || request.nurseId, user._id)) {
        throw new ForbiddenException('Only the assigned nurse can complete requests');
      }
      if (request.status !== RequestStatus.IN_PROGRESS && request.status !== RequestStatus.ACCEPTED) {
        throw new BadRequestException('Only in-progress or accepted requests can be completed');
      }
      request.completedAt = new Date();
    } else if (status === RequestStatus.CANCELLED) {
      // Allow both patient owner or any admin to cancel the request
      if (user.role === UserRole.ADMIN) {
        // Admin can cancel any request that is pending or in progress
        if (request.status !== RequestStatus.PENDING && request.status !== RequestStatus.IN_PROGRESS) {
          throw new BadRequestException('Admin can only cancel pending or in-progress requests');
        }
      } else if (user.role === UserRole.PATIENT) {
        // Patient can only cancel their own requests
        if (!this.compareObjectIds((request.patientId as any)?._id || request.patientId, user._id)) {
          throw new ForbiddenException('You can only cancel your own requests');
        }
      } else {
        throw new ForbiddenException('Only the patient or an admin can cancel requests');
      }
      request.cancelledAt = new Date();
      request.cancellationReason = cancellationReason || 'Cancelled by admin';
    } else if (status === RequestStatus.IN_PROGRESS) {
      if (user.role !== UserRole.NURSE || !this.compareObjectIds((request.nurseId as any)?._id || request.nurseId, user._id)) {
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

  async markCompletedByNurse(requestId: string, user: UserDocument) {
    // Find the request
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Only nurses can mark as completed by nurse
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException('Only nurses can mark requests as completed by nurse');
    }

    // Request must be in progress
    if (request.status !== RequestStatus.IN_PROGRESS) {
      throw new BadRequestException('Request must be in progress to be marked as completed');
    }

    // Mark as completed by nurse
    request.nurseCompleted = true;
    request.nurseCompletedAt = new Date();

    // If both nurse and patient have marked as completed, set status to completed
    if (request.patientCompleted && request.nurseCompleted) {
      request.status = RequestStatus.COMPLETED;
      request.completedAt = new Date();

      // Send completion notifications to both parties
      try {
        const patient = await this.userModel.findById(request.patientId).exec();
        const nurse = await this.userModel.findById(request.nurseId).exec();

        if (patient && nurse) {
          // Notify both parties that the request is completed and they can leave reviews
          await Promise.all([
            this.notificationsService.notifyRequestCompleted(
              patient._id.toString(),
              request._id.toString(),
              request.title,
              true // isPatient
            ),
            this.notificationsService.notifyRequestCompleted(
              nurse._id.toString(),
              request._id.toString(),
              request.title,
              false // isPatient
            )
          ]);
        }
      } catch (notificationError) {
        console.error('Failed to send completion notifications:', notificationError);
        // Don't fail the completion if notification fails
      }
    }

    await request.save();

    return {
      success: true,
      message: 'Request marked as completed by nurse',
      request: request
    };
  }

  async markCompletedByPatient(requestId: string, user: UserDocument) {
    // Find the request
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Only the patient who created the request can mark it as completed
    if (user.role !== UserRole.PATIENT || !this.compareObjectIds(request.patientId, user._id)) {
      throw new ForbiddenException('Only the patient who created this request can mark it as completed');
    }

    // Request must be in progress
    if (request.status !== RequestStatus.IN_PROGRESS) {
      throw new BadRequestException('Request must be in progress to be marked as completed');
    }

    // Mark as completed by patient
    request.patientCompleted = true;
    request.patientCompletedAt = new Date();

    // If both nurse and patient have marked as completed, set status to completed
    if (request.patientCompleted && request.nurseCompleted) {
      request.status = RequestStatus.COMPLETED;
      request.completedAt = new Date();

      // Send completion notifications to both parties
      try {
        const patient = await this.userModel.findById(request.patientId).exec();
        const nurse = await this.userModel.findById(request.nurseId).exec();

        if (patient && nurse) {
          // Notify both parties that the request is completed and they can leave reviews
          await Promise.all([
            this.notificationsService.notifyRequestCompleted(
              patient._id.toString(),
              request._id.toString(),
              request.title,
              true // isPatient
            ),
            this.notificationsService.notifyRequestCompleted(
              nurse._id.toString(),
              request._id.toString(),
              request.title,
              false // isPatient
            )
          ]);
        }
      } catch (notificationError) {
        console.error('Failed to send completion notifications:', notificationError);
        // Don't fail the completion if notification fails
      }
    }

    await request.save();

    return {
      success: true,
      message: 'Request marked as completed by patient',
      request: request
    };
  }
}
