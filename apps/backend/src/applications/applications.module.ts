import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { PatientRequest, PatientRequestSchema } from '../schemas/patient-request.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: PatientRequest.name, schema: PatientRequestSchema },
      { name: User.name, schema: UserSchema }
    ]),
    NotificationsModule
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService]
})
export class ApplicationsModule {}
