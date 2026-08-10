import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { PointModule } from '../point/point.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [PaymentModule, PointModule],
  controllers: [ProductController, CartController],
  providers: [ProductService, CartService],
  exports: [ProductService, CartService],
})
export class ProductModule {}
