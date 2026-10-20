import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '../database/database.module.js';
import { asc } from 'drizzle-orm';
import { products } from '../database/schema.js';

@Injectable()
export class ProductsService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}
  async findAll() {
    return this.database
      .select()
      .from(products)
      .orderBy(asc(products.productName), asc(products.id));
  }
}
