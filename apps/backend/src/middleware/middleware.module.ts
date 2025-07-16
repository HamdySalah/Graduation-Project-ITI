import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NurseProfileCompletionMiddleware } from './nurse-profile-completion.middleware';
import { NurseProfileStatusService } from '../services/nurse-profile-status.service';
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
  providers: [NurseProfileStatusService],
  exports: [NurseProfileStatusService],
})
export class MiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(NurseProfileCompletionMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
