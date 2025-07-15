import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NursesService } from './nurses.service';
import { NursesController } from './nurses.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { NurseProfile, NurseProfileSchema } from '../schemas/nurse-profile.schema';
import { ProfileSubmission, ProfileSubmissionSchema } from '../schemas/profile-submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: NurseProfile.name, schema: NurseProfileSchema },
      { name: ProfileSubmission.name, schema: ProfileSubmissionSchema },
    ]),
  ],
  providers: [NursesService],
  controllers: [NursesController],
  exports: [NursesService],
})
export class NursesModule {}
