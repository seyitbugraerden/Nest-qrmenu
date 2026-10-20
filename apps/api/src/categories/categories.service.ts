import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE, type Database } from '../database/database.module.js';
import { asc, eq } from 'drizzle-orm';
import { categories } from '../database/schema.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}
  async findAll() {
    return this.database
      .select()
      .from(categories)
      .orderBy(asc(categories.categoryName), asc(categories.id));
  }
  async findBySlug(slug: string) {
    const [category] = await this.database
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı.');
    }

    return category;
  }
  async update(slug: string, body: UpdateCategoryDto) {
    const changes = {
      ...(body.categoryName !== undefined && {
        categoryName: body.categoryName,
      }),
      ...(body.slug !== undefined && {
        slug: body.slug,
      }),
      ...(body.categoryImage !== undefined && {
        categoryImage: body.categoryImage,
      }),
    };

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('Güncellenecek alan gönderilmedi.');
    }

    const [category] = await this.database
      .update(categories)
      .set(changes)
      .where(eq(categories.slug, slug))
      .returning();

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı.');
    }

    return category;
  }
  async remove(slug: string) {
    let deletedCategory: typeof categories.$inferSelect | undefined;

    try {
      [deletedCategory] = await this.database
        .delete(categories)
        .where(eq(categories.slug, slug))
        .returning();
    } catch (error: unknown) {
      const dbError = error as {
        code?: string;
        cause?: { code?: string };
      };

      const code = dbError.cause?.code ?? dbError.code;

      if (code === '23503') {
        throw new ConflictException(
          'Bu kategoride ürünler var. Önce ürünleri taşımalı veya silmelisin.',
        );
      }

      throw error;
    }

    if (!deletedCategory) {
      throw new NotFoundException('Kategori bulunamadı.');
    }

    return deletedCategory;
  }
  async create(body: CreateCategoryDto) {
    const [category] = await this.database
      .insert(categories)
      .values({
        categoryName: body.categoryName,
        slug: body.slug,
        categoryId: body.categoryId,
        categoryImage: body.categoryImage,
      })
      .returning();
    return category;
  }
}
