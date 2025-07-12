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

  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    this.logger.log(`Attempting to send verification email to ${email} with URL: ${verificationUrl}`);

    try {
      // تجربة كلا القالبين إذا فشل أحدهما
      try {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Verify Your Email - Nurse Platform',
          template: 'email-verification', // جرب أولاً القالب الإنجليزي
          context: {
            name,
            verificationUrl,
            frontendUrl,
          },
        });
      } catch (templateError: any) {
        this.logger.warn(`Failed with email-verification template, trying verification template: ${templateError.message}`);
        // إذا فشل القالب الأول، جرب القالب الثاني
        await this.mailerService.sendMail({
          to: email,
          subject: 'تأكيد بريدك الإلكتروني - منصة الممرضين',
          template: 'verification', // جرب القالب العربي
          context: {
            name,
            verificationUrl,
            frontendUrl,
            url: verificationUrl, // لدعم القالب القديم الذي يستخدم {{url}}
          },
        });
      }

      this.logger.log(`Verification email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      // لا نرمي استثناءً هنا لتجنب فشل عملية التسجيل
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Nurse Platform!',
        template: 'welcome',
        context: {
          name,
          frontendUrl,
          loginUrl: `${frontendUrl}/login`,
        },
      });

      this.logger.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }
}
