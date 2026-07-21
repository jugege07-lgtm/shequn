import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemModule } from '../system/system.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [SystemModule, PaymentModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
