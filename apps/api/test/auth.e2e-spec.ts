import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { AdminAuthGuard } from '../src/auth/auth.guard.js';
import { AuthService } from '../src/auth/auth.service.js';
import { CategoriesController } from '../src/categories/categories.controller.js';
import { ProductsController } from '../src/products/products.controller.js';
import { CategoriesService } from '../src/categories/categories.service.js';
import { ProductsService } from '../src/products/products.service.js';

const id = '607673e5-3d15-432c-9f2e-f97942a83779';
const token = 'a'.repeat(43);
const categories = {
  findAll: vi.fn(async () => []),
  findBySlug: vi.fn(async () => ({})),
  create: vi.fn(async () => ({})),
  update: vi.fn(async () => ({})),
  remove: vi.fn(async () => ({})),
};
const products = {
  findAll: vi.fn(async () => []),
  findByCategorySlug: vi.fn(async () => []),
  findOne: vi.fn(async () => ({})),
  create: vi.fn(async () => ({})),
  update: vi.fn(async () => ({})),
  remove: vi.fn(async () => ({})),
};
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [CategoriesController, ProductsController],
    providers: [
      {
        provide: AuthService,
        useValue: {
          authenticate: async (value: string) => {
            if (value !== token) throw new UnauthorizedException();
            return { admin: { id: 'admin' } };
          },
        },
      },
      { provide: CategoriesService, useValue: categories },
      { provide: ProductsService, useValue: products },
      { provide: APP_GUARD, useClass: AdminAuthGuard },
    ],
  }).compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(async () => {
  await app.close();
});
describe('real category/product routes enforce authorization', () => {
  it('keeps public menu reads available', async () => {
    for (const path of [
      '/categories',
      '/categories/kahveler',
      '/products',
      '/products/kahveler',
      `/products/detail/${id}`,
    ])
      await request(app.getHttpServer()).get(path).expect(200);
  });
  it('rejects every mutation without valid bearer credentials, before service execution', async () => {
    for (const resource of ['categories', 'products']) {
      const path =
        resource === 'categories'
          ? '/categories/kahveler'
          : `/products/detail/${id}`;
      await request(app.getHttpServer())
        .post(`/${resource}`)
        .send({})
        .expect(401);
      await request(app.getHttpServer()).patch(path).send({}).expect(401);
      await request(app.getHttpServer()).delete(path).expect(401);
    }
    expect(categories.create).not.toHaveBeenCalled();
    expect(products.remove).not.toHaveBeenCalled();
  });
  it('does not accept cookies or invalid bearer tokens as API authorization', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .set('Cookie', `nest-admin=${token}`)
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', 'Bearer invalid')
      .send({})
      .expect(401);
  });
  it('permits authorized mutations', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);
    await request(app.getHttpServer())
      .patch('/categories/kahveler')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    expect(products.create).toHaveBeenCalledOnce();
  });
});
