import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Controller('categories')
export class CategoriesController {
  constructor(
    @Inject(CategoriesService)
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() body: UpdateCategoryDto) {
    return this.categoriesService.update(slug, body);
  }
  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.categoriesService.remove(slug);
  }
}
