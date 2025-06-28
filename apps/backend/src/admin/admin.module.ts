import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { NursesModule } from '../nurses/nurses.module';

@Module({
  imports: [NursesModule],
  controllers: [AdminController],
})
export class AdminModule {}
