import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { SystemService } from './system.service';

@Module({
  controllers: [PublicController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
