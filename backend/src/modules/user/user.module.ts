import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AddressService } from './address.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  controllers: [UserController],
  providers: [UserService, AddressService],
  exports: [UserService, AddressService],
})
export class UserModule {}
