import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationPriority } from '../schemas/notification.schema';
import { User, UserDocument } from '../schemas/user.schema';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  data?: Record<string, any>;
  expiresAt?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Create a new notification
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = new this.notificationModel(createNotificationDto);
    return await notification.save();
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false, type } = options;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (unreadOnly) query.isRead = false;
    if (type) query.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(query).exec(),
      this.notificationModel.countDocuments({ userId, isRead: false }).exec()
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    return await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).exec();
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    ).exec();
    
    return { modifiedCount: result.modifiedCount };
  }

  // Delete a notification
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.notificationModel.deleteOne({
      _id: notificationId,
      userId
    }).exec();
    
    return result.deletedCount > 0;
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationModel.countDocuments({
      userId,
      isRead: false
    }).exec();
  }

  // Specific notification creators for different events
  async notifyNurseApproved(nurseId: string): Promise<NotificationDocument> {
    return await this.createNotification({
      userId: nurseId,
      type: NotificationType.NURSE_APPROVED,
      title: '🎉 Application Approved!',
      message: 'Congratulations! Your nurse application has been approved. You can now start accepting patient requests.',
      priority: NotificationPriority.HIGH,
      actionUrl: '/dashboard',
      data: { approved: true }
    });
  }

  async notifyNurseRejected(nurseId: string, reason?: string): Promise<NotificationDocument> {
    return await this.createNotification({
      userId: nurseId,
      type: NotificationType.NURSE_REJECTED,
      title: '❌ Application Rejected',
      message: reason 
        ? `Unfortunately, your nurse application has been rejected. Reason: ${reason}`
        : 'Unfortunately, your nurse application has been rejected. Please contact support for more information.',
      priority: NotificationPriority.HIGH,
      actionUrl: '/profile',
      data: { rejected: true, reason }
    });
  }

  async notifyRequestApplication(patientId: string, nurseId: string, nurseName: string, requestId: string, requestTitle: string): Promise<NotificationDocument> {
    return await this.createNotification({
      userId: patientId,
      type: NotificationType.REQUEST_APPLICATION,
      title: '👩‍⚕️ New Application Received',
      message: `${nurseName} has applied to your request "${requestTitle}". Review their application now.`,
      priority: NotificationPriority.MEDIUM,
      relatedEntityId: requestId,
      relatedEntityType: 'request',
      actionUrl: `/requests/${requestId}`,
      data: { nurseId, nurseName, requestTitle }
    });
  }

  async notifyRequestAccepted(nurseId: string, patientName: string, requestId: string, requestTitle: string): Promise<NotificationDocument> {
    return await this.createNotification({
      userId: nurseId,
      type: NotificationType.REQUEST_ACCEPTED,
      title: '✅ Request Accepted',
      message: `Great news! ${patientName} has accepted your application for "${requestTitle}".`,
      priority: NotificationPriority.HIGH,
      relatedEntityId: requestId,
      relatedEntityType: 'request',
      actionUrl: `/requests/${requestId}`,
      data: { patientName, requestTitle }
    });
  }

  async notifyRequestRejected(nurseId: string, patientName: string, requestId: string, requestTitle: string): Promise<NotificationDocument> {
    return await this.createNotification({
      userId: nurseId,
      type: NotificationType.REQUEST_REJECTED,
      title: '❌ Application Declined',
      message: `${patientName} has declined your application for "${requestTitle}".`,
      priority: NotificationPriority.MEDIUM,
      relatedEntityId: requestId,
      relatedEntityType: 'request',
      actionUrl: `/requests`,
      data: { patientName, requestTitle }
    });
  }

  async notifyRequestCompleted(userId: string, requestId: string, requestTitle: string, isPatient: boolean): Promise<NotificationDocument> {
    const role = isPatient ? 'patient' : 'nurse';
    const otherRole = isPatient ? 'nurse' : 'patient';
    
    return await this.createNotification({
      userId,
      type: NotificationType.REQUEST_COMPLETED,
      title: '🎯 Request Completed',
      message: `The request "${requestTitle}" has been marked as completed. You can now leave a review for the ${otherRole}.`,
      priority: NotificationPriority.MEDIUM,
      relatedEntityId: requestId,
      relatedEntityType: 'request',
      actionUrl: `/requests/${requestId}/reviews`,
      data: { requestTitle, role }
    });
  }

  async notifyReviewReceived(userId: string, reviewerName: string, rating: number, requestTitle: string): Promise<NotificationDocument> {
    const stars = '⭐'.repeat(rating);
    
    return await this.createNotification({
      userId,
      type: NotificationType.REVIEW_RECEIVED,
      title: '⭐ New Review Received',
      message: `${reviewerName} left you a ${rating}-star review ${stars} for "${requestTitle}".`,
      priority: NotificationPriority.LOW,
      actionUrl: '/profile',
      data: { reviewerName, rating, requestTitle }
    });
  }

  async notifySystemAnnouncement(userIds: string[], title: string, message: string, actionUrl?: string): Promise<NotificationDocument[]> {
    const notifications = userIds.map(userId => ({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title,
      message,
      priority: NotificationPriority.MEDIUM,
      actionUrl,
      data: { isSystemAnnouncement: true }
    }));

    return await this.notificationModel.insertMany(notifications);
  }

  // Clean up old notifications (can be called by a cron job)
  async cleanupOldNotifications(daysOld: number = 30): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    }).exec();

    return { deletedCount: result.deletedCount };
  }
}
