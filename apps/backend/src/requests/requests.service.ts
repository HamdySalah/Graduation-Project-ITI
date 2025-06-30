import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { UserDocument, UserRole } from '../schemas/user.schema';
import { CreateRequestDto, UpdateRequestStatusDto } from '../dto/request.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(PatientRequest.name) private requestModel: Model<PatientRequestDocument>,
  ) {}

  async createRequest(createRequestDto: CreateRequestDto, patientUser: UserDocument) {
    // Ensure only patients can create requests
    if (patientUser.role !== UserRole.PATIENT) {
      throw new ForbiddenException('Only patients can create service requests');
    }

    const { coordinates, scheduledDate, ...requestData } = createRequestDto;

    const request = new this.requestModel({
      ...requestData,
      patientId: patientUser._id as any,
      location: {
        type: 'Point',
        coordinates: coordinates, // [longitude, latitude]
      },
      scheduledDate: new Date(scheduledDate || Date.now()),
    });

    const savedRequest = await request.save();

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
}
