import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { PatientRequest, PatientRequestSchema } from '../schemas/patient-request.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientRequest.name, schema: PatientRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  providers: [RequestsService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
