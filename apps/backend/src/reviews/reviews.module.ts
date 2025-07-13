import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { PatientRequest, PatientRequestSchema } from '../schemas/patient-request.schema';
import { NurseProfile, NurseProfileSchema } from '../schemas/nurse-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: User.name, schema: UserSchema },
      { name: PatientRequest.name, schema: PatientRequestSchema },
      { name: NurseProfile.name, schema: NurseProfileSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
