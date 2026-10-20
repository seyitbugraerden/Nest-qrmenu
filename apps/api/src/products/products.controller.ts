import { Controller, Get, Inject } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }
}