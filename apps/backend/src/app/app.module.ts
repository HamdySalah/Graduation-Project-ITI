import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { NursesModule } from '../nurses/nurses.module';
import { RequestsModule } from '../requests/requests.module';
import { AdminModule } from '../admin/admin.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { UserManagementModule } from '../user-management/user-management.module';
import { ReviewsModule } from '../reviews/reviews.module';
// import { EmailModule } from '../email/email.module'; // Temporarily disabled due to build issues
import { configValidationSchema } from '../config/config.validation';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

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
    AdminModule,
    DashboardModule,
    UserManagementModule,
    ReviewsModule,
    // EmailModule, // Temporarily disabled due to build issues
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
