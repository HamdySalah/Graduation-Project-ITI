import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NurseProfileStatusService } from '../services/nurse-profile-status.service';
import { NurseProfileStatusController } from '../controllers/nurse-profile-status.controller';
import { NurseProfileCompletionService } from '../services/nurse-profile-completion.service';
import { NurseProfileCompletionController } from '../controllers/nurse-profile-completion.controller';
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
  providers: [
    NurseProfileStatusService,
    NurseProfileCompletionService,
  ],
  controllers: [
    NurseProfileStatusController,
    NurseProfileCompletionController,
  ],
  exports: [
    NurseProfileStatusService,
    NurseProfileCompletionService,
  ],
})
export class NurseProfileStatusModule {}
