import { Public } from '../auth/public.decorator.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { UpdateProductDto } from './dto/update-product-dto.js';
import { CreateProductDto } from './dto/export-product-dto.js';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.productsService.findAll();
  }
  @Public()
  @Get(':slug')
  findByCategorySlug(@Param('slug') slug: string) {
    return this.productsService.findByCategorySlug(slug);
  }
  @Public()
  @Get('detail/:id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }
  @Patch('detail/:id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.productsService.update(id, body);
  }
  @Delete('detail/:id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.remove(id);
  }
  @Post()
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }
}
