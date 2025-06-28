import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NursesService } from './nurses.service';
import { NursesController } from './nurses.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { NurseProfile, NurseProfileSchema } from '../schemas/nurse-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: NurseProfile.name, schema: NurseProfileSchema },
    ]),
  ],
  providers: [NursesService],
  controllers: [NursesController],
  exports: [NursesService],
})
export class NursesModule {}
