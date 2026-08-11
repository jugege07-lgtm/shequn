import { Module } from '@nestjs/common';
import { SystemModule } from '../system/system.module';
import { ActivityModule } from '../activity/activity.module';
import { BusinessModule } from '../business/business.module';
import { VipModule } from '../vip/vip.module';
import { UserModule } from '../user/user.module';
import { BalanceModule } from '../balance/balance.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  imports: [SystemModule, ActivityModule, BusinessModule, VipModule, UserModule, BalanceModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
