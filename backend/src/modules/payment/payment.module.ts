import { Module } from '@nestjs/common';
import { SystemModule } from '../system/system.module';
import { ActivityModule } from '../activity/activity.module';
import { BusinessModule } from '../business/business.module';
import { VipModule } from '../vip/vip.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [SystemModule, ActivityModule, BusinessModule, VipModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
