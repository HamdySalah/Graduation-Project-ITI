import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';
import { PatientRequest, PatientRequestDocument, RequestStatus } from '../schemas/patient-request.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/application.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
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

  async applyToRequest(createApplicationDto: CreateApplicationDto, nurseUser: UserDocument) {
    // Ensure the user is a nurse
    if (nurseUser.role !== UserRole.NURSE) {
      throw new ForbiddenException('Only nurses can apply to requests');
    }

    // Check if the request exists and is still open
    const request = await this.requestModel.findById(createApplicationDto.requestId);
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check if request is open for applications
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('This request is not accepting applications');
    }

    // Check if nurse has already applied
    const existingApplication = await this.applicationModel.findOne({
      requestId: new Types.ObjectId(createApplicationDto.requestId),
      nurseId: nurseUser._id
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied to this request');
    }

    // Create the application
    const application = await this.applicationModel.create({
      requestId: new Types.ObjectId(createApplicationDto.requestId),
      nurseId: nurseUser._id,
      price: createApplicationDto.price,
      estimatedTime: createApplicationDto.estimatedTime,
      status: ApplicationStatus.PENDING
    });

    // Send notification to patient about new application
    try {
      const patient = await this.userModel.findById(request.patientId).exec();
      if (patient) {
        await this.notificationsService.notifyRequestApplication(
          patient._id.toString(),
          nurseUser._id.toString(),
          nurseUser.name || 'A nurse',
          request._id.toString(),
          request.title
        );
      }
    } catch (notificationError) {
      console.error('Failed to send application notification:', notificationError);
      // Don't fail the application if notification fails
    }

    return {
      id: application._id,
      requestId: application.requestId,
      nurseId: application.nurseId,
      price: application.price,
      estimatedTime: application.estimatedTime,
      status: application.status,
      createdAt: application.createdAt
    };
  }

  async getApplicationsByRequest(requestId: string, user: UserDocument) {
    // Validate request exists
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Check permissions
    const isPatient = this.compareObjectIds(request.patientId, user._id);
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isPatient && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view these applications');
    }

    // Get applications for this request
    const applications = await this.applicationModel
      .find({ requestId: new Types.ObjectId(requestId) })
      .populate('nurseId', '-password')
      .sort({ createdAt: -1 })
      .exec();

    return applications.map(application => ({
      id: application._id,
      requestId: application.requestId,
      nurseId: (application.nurseId as any)._id,
      nurseName: (application.nurseId as any).name,
      nursePhone: (application.nurseId as any).phone,
      nurseEmail: (application.nurseId as any).email,
      price: application.price,
      estimatedTime: application.estimatedTime,
      status: application.status,
      createdAt: application.createdAt
    }));
  }

  async getApplicationsByNurse(user: UserDocument) {
    // Ensure user is a nurse
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException('Only nurses can view their applications');
    }

    // Get applications for this nurse
    const applications = await this.applicationModel
      .find({ nurseId: user._id })
      .populate({
        path: 'requestId',
        populate: { path: 'patientId', select: '-password' }
      })
      .sort({ createdAt: -1 })
      .exec();

    return applications.map(application => {
      const request = application.requestId as any;
      return {
        id: application._id,
        price: application.price,
        estimatedTime: application.estimatedTime,
        status: application.status,
        createdAt: application.createdAt,
        request: {
          id: request._id,
          title: request.title,
          description: request.description,
          address: request.address,
          scheduledDate: request.scheduledDate,
          estimatedDuration: request.estimatedDuration,
          budget: request.budget,
          status: request.status,
          patient: {
            id: request.patientId._id,
            name: request.patientId.name,
            phone: request.patientId.phone
          }
        }
      };
    });
  }

  async updateApplicationStatus(applicationId: string, updateDto: UpdateApplicationStatusDto, user: UserDocument) {
    // Find the application
    const application = await this.applicationModel.findById(applicationId).populate('requestId');
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const request = application.requestId as unknown as PatientRequestDocument;

    // Check permissions (only the patient who owns the request can update application status)
    const isPatient = this.compareObjectIds(request.patientId, user._id);
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isPatient && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this application');
    }

    // If accepting an application
    if (updateDto.status === ApplicationStatus.ACCEPTED) {
      // Update the request to assign the nurse and change status to in_progress
      await this.requestModel.findByIdAndUpdate(request._id, {
        nurseId: application.nurseId,
        status: RequestStatus.IN_PROGRESS,
        acceptedAt: new Date()
      });

      // Reject all other applications for this request
      await this.applicationModel.updateMany(
        { 
          requestId: request._id, 
          _id: { $ne: application._id } 
        },
        { 
          status: ApplicationStatus.REJECTED 
        }
      );
    }

    // Update the application status
    application.status = updateDto.status;
    await application.save();

    // Send notifications based on status change
    try {
      const nurse = await this.userModel.findById(application.nurseId).exec();
      const patient = await this.userModel.findById(request.patientId).exec();

      if (nurse && patient) {
        if (updateDto.status === ApplicationStatus.ACCEPTED) {
          await this.notificationsService.notifyRequestAccepted(
            nurse._id.toString(),
            patient.name || 'A patient',
            request._id.toString(),
            request.title
          );
        } else if (updateDto.status === ApplicationStatus.REJECTED) {
          await this.notificationsService.notifyRequestRejected(
            nurse._id.toString(),
            patient.name || 'A patient',
            request._id.toString(),
            request.title
          );
        }
      }
    } catch (notificationError) {
      console.error('Failed to send application status notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    return {
      id: application._id,
      status: application.status,
      updatedAt: new Date()
    };
  }

  async updateApplication(applicationId: string, updateData: { price: number, estimatedTime: number }, user: UserDocument) {
    // Find the application
    const application = await this.applicationModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if the user is the nurse who applied
    if (user.role !== UserRole.NURSE || !this.compareObjectIds(application.nurseId, user._id)) {
      throw new ForbiddenException('You can only update your own applications');
    }

    // Only allow updating of pending applications
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be updated');
    }

    // Update the application
    const updatedApplication = await this.applicationModel.findByIdAndUpdate(
      applicationId,
      {
        price: updateData.price,
        estimatedTime: updateData.estimatedTime,
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      message: 'Application updated successfully',
      application: {
        id: updatedApplication._id,
        price: updatedApplication.price,
        estimatedTime: updatedApplication.estimatedTime,
        status: updatedApplication.status,
        updatedAt: updatedApplication.updatedAt
      }
    };
  }

  async cancelApplication(applicationId: string, user: UserDocument) {
    // Find the application
    const application = await this.applicationModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if the user is the nurse who applied or has permission to cancel
    if (user.role === UserRole.NURSE && !this.compareObjectIds(application.nurseId, user._id)) {
      throw new ForbiddenException('You can only cancel your own applications');
    }

    // Only allow cancellation of pending applications
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be cancelled');
    }

    // Delete the application
    await this.applicationModel.findByIdAndDelete(applicationId);

    return {
      message: 'Application cancelled successfully',
      applicationId: applicationId
    };
  }
}
