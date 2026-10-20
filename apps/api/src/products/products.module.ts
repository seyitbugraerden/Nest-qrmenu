import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [DatabaseModule],
})
export class ProductsModule {}
