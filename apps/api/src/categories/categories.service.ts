import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '../database/database.module.js';
import { asc } from 'drizzle-orm';
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
}
