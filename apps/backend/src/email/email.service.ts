import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email - Nurse Platform',
        template: 'email-verification',
        context: {
          name,
          email,
          verificationUrl,
          frontendUrl,
        },
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to CareConnect - Nurse Registration Successful! 🎉',
        template: 'welcome',
        context: {
          name,
          email,
          frontendUrl: this.configService.get<string>('FRONTEND_URL'),
        },
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
    }
  }

  async sendApprovalEmail(email: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '🎉 Congratulations! Your Nurse Application has been Approved',
        template: 'approval',
        context: {
          name,
          email,
          frontendUrl: this.configService.get<string>('FRONTEND_URL'),
          dashboardUrl: `${this.configService.get<string>('FRONTEND_URL')}/nurse/dashboard`,
        },
      });

      this.logger.log(`Approval email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send approval email to ${email}:`, error);
      throw new Error('Failed to send approval email');
    }
  }

  async sendRejectionEmail(email: string, name: string, reason?: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Update on Your Nurse Application - CareConnect',
        template: 'rejection',
        context: {
          name,
          email,
          reason: reason || 'Please contact support for more information.',
          frontendUrl: this.configService.get<string>('FRONTEND_URL'),
          supportEmail: this.configService.get<string>('MAIL_USER'),
        },
      });

      this.logger.log(`Rejection email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send rejection email to ${email}:`, error);
      throw new Error('Failed to send rejection email');
    }
  }
}
