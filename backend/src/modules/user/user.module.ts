import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AddressService } from './address.service';

@Module({
  controllers: [UserController],
  providers: [UserService, AddressService],
  exports: [UserService, AddressService],
})
export class UserModule {}
