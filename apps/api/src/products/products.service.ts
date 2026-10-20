import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '../database/database.module.js';
import { asc, eq } from 'drizzle-orm';
import { categories, products } from '../database/schema.js';

@Injectable()
export class ProductsService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}
  async findAll() {
    return this.database
      .select()
      .from(products)
      .orderBy(asc(products.productName), asc(products.id));
  }
  async findByCategorySlug(slug: string) {
    return this.database
      .select({ product: products })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.categoryId))
      .where(eq(categories.slug, slug))
      .orderBy(asc(products.productName), asc(products.id))
      .then((rows) => rows.map((row) => row.product));
  }
}
