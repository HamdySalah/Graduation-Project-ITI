import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { NursesModule } from '../nurses/nurses.module';
import { User, UserSchema } from '../schemas/user.schema';
import { PatientRequest, PatientRequestSchema } from '../schemas/patient-request.schema';
import { NurseProfile, NurseProfileSchema } from '../schemas/nurse-profile.schema';

@Module({
  imports: [
    NursesModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PatientRequest.name, schema: PatientRequestSchema },
      { name: NurseProfile.name, schema: NurseProfileSchema }
    ])
  ],
  controllers: [AdminController],
})
export class AdminModule {}
