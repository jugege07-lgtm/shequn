import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { ModerationModule } from './common/moderation/moderation.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CardModule } from './modules/card/card.module';
import { SystemModule } from './modules/system/system.module';
import { ContentModule } from './modules/content/content.module';
import { VersionModule } from './modules/version/version.module';
import { AdminModule } from './modules/admin/admin.module';
import { ActivityModule } from './modules/activity/activity.module';
import { BusinessModule } from './modules/business/business.module';
import { ProductModule } from './modules/product/product.module';
import { VipModule } from './modules/vip/vip.module';
import { MessageModule } from './modules/message/message.module';
import { UploadModule } from './modules/upload/upload.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { PointModule } from './modules/point/point.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ConnectionModule } from './modules/connection/connection.module';
import { BalanceModule } from './modules/balance/balance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ModerationModule,
    AuthModule,
    UserModule,
    CardModule,
    SystemModule,
    ContentModule,
    VersionModule,
    AdminModule,
    ActivityModule,
    BusinessModule,
    ProductModule,
    VipModule,
    MessageModule,
    UploadModule,
    CouponModule,
    PointModule,
    PaymentModule,
    ConnectionModule,
    BalanceModule,
  ],
})
export class AppModule {}
