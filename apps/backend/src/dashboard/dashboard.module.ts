import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User, UserSchema } from '../schemas/user.schema';
import { PatientRequest, PatientRequestSchema } from '../schemas/patient-request.schema';
import { NurseProfile, NurseProfileSchema } from '../schemas/nurse-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PatientRequest.name, schema: PatientRequestSchema },
      { name: NurseProfile.name, schema: NurseProfileSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
