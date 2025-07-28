import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { NursesModule } from '../nurses/nurses.module';
import { RequestsModule } from '../requests/requests.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AdminModule } from '../admin/admin.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { UserManagementModule } from '../user-management/user-management.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NurseProfileStatusModule } from '../nurse-profile-status/nurse-profile-status.module';
import { MiddlewareModule } from '../middleware/middleware.module';
import { EmailModule } from '../email/email.module';
import { configValidationSchema } from '../config/config.validation';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { AiChatModule } from '../ai-chat/ai-chat.module';
import { PaymentsModule } from '../payments/payments.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        retryWrites: true,
        w: 'majority',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    NursesModule,
    RequestsModule,
    ApplicationsModule,
    AdminModule,
    DashboardModule,
    UserManagementModule,
    ReviewsModule,
    NotificationsModule,
    NurseProfileStatusModule,
    MiddlewareModule,
    UploadsModule,
    EmailModule,
    AiChatModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
