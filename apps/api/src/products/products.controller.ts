import { Controller, Get, Inject, Param } from '@nestjs/common';
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
  @Get(':slug')
  findByCategorySlug(@Param('slug') slug: string) {
    return this.productsService.findByCategorySlug(slug);
  }
}
