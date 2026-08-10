import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SystemModule } from '../system/system.module';
import { PaymentModule } from '../payment/payment.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [SystemModule, PaymentModule],
  controllers: [AdminController],
  providers: [AdminService, PermissionsGuard],
  exports: [AdminService],
})
export class AdminModule {}
