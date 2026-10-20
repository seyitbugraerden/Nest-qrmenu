import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE, type Database } from '../database/database.module.js';
import { asc, eq } from 'drizzle-orm';
import { categories } from '../database/schema.js';

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
}
