import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NursesService } from './nurses.service';
import { NursesController } from './nurses.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { NurseProfile, NurseProfileSchema } from '../schemas/nurse-profile.schema';
import { ProfileSubmission, ProfileSubmissionSchema } from '../schemas/profile-submission.schema';
import { PatientRequest, PatientRequestSchema } from '../schemas/patient-request.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: NurseProfile.name, schema: NurseProfileSchema },
      { name: ProfileSubmission.name, schema: ProfileSubmissionSchema },
      { name: PatientRequest.name, schema: PatientRequestSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  providers: [NursesService],
  controllers: [NursesController],
  exports: [NursesService],
})
export class NursesModule {}
