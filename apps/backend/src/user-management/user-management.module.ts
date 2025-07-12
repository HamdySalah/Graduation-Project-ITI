import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
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
  controllers: [UserManagementController],
  providers: [UserManagementService],
  exports: [UserManagementService],
})
export class UserManagementModule {}
