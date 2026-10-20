import 'dotenv/config';
import { Module } from '@nestjs/common';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

export const DATABASE = Symbol('DATABASE');

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL ortam değişkeni tanımlı değil.');
  }

  return drizzle(neon(databaseUrl), { schema });
}

export type Database = ReturnType<typeof createDatabase>;

@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: createDatabase,
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
