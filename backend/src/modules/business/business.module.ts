import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { PointModule } from '../point/point.module';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [PointModule, BalanceModule],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
