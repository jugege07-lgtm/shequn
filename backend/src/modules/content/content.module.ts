import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ActivityModule } from '../activity/activity.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [ActivityModule, BusinessModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}