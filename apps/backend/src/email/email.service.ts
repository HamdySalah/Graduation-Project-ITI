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
        subject: 'Welcome to Nurse Platform!',
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
}
