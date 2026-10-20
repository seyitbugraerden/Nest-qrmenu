import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE, type Database } from '../database/database.module.js';
import { asc, eq } from 'drizzle-orm';
import { categories, products } from '../database/schema.js';
import { UpdateProductDto } from './dto/update-product-dto.js';

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
  async findOne(id: string) {
    const [product] = await this.database
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }
  async update(id: string, body: UpdateProductDto) {
    const changes = {
      ...(body.productName !== undefined && {
        productName: body.productName,
      }),
      ...(body.productImage !== undefined && {
        productImage: body.productImage,
      }),
      ...(body.productPrice !== undefined && {
        productPrice: body.productPrice,
      }),
      ...(body.productDiscount !== undefined && {
        productDiscount: body.productDiscount,
      }),
      ...(body.categoryId !== undefined && {
        categoryId: body.categoryId,
      }),
    };
    const [product] = await this.database
      .update(products)
      .set(changes)
      .where(eq(products.id, id))
      .returning();
    return product;
  }
  async remove(id: string) {
    let deletedProduct: typeof products.$inferSelect | undefined;

    try {
      [deletedProduct] = await this.database
        .delete(products)
        .where(eq(products.id, id))
        .returning();
    } catch (error: unknown) {
      const dbError = error as {
        code?: string;
        cause: { code?: string };
      };
      const code = dbError.cause?.code ?? dbError.code;
      if (code === '23503') {
        throw new ConflictException(
          'Bu ürün başka kayıtlarla ilişkili olduğu için silinemiyor.',
        );
      }

      throw error;
    }
    if (!deletedProduct) {
      throw new NotFoundException('Product Bulunamadı');
    }
    return deletedProduct;
  }
}
