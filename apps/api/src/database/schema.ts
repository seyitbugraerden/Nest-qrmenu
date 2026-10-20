import { index, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  categoryName: text('category_name').notNull(),
  categoryId: text('category_id').notNull().unique(),
  categoryImage: text('category_image').unique(),
});

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productName: text('product_name').notNull(),
    productId: text('product_id').notNull().unique(),
    productImage: text('product_image').unique(),
    productPrice: numeric('product_price').notNull().default('0.00'),
    productDiscount: numeric('product_discount').default('0.00'),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.categoryId, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
  },
  (table) => [index('products_category_id_idx').on(table.categoryId)],
);

export * from '../auth/auth.schema.js';
