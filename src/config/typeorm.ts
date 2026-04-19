import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.STORAGE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED;

if (process.env.VERCEL && !databaseUrl) {
  throw new Error(
    'Missing database URL. Add DATABASE_URL, STORAGE_URL, or POSTGRES_URL in Vercel Environment Variables.',
  );
}

const config = {
  type: 'postgres',
  ...(databaseUrl
    ? {
        url: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: 'localhost',
        port: 5432,
        username: process.env.DB_USER || process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB || process.env.POSTGRES_DATABASE,
      }),
  autoLoadEntities: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: true,
  dropSchema: false,
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
