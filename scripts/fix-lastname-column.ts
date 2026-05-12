import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
import { Client, ClientConfig } from 'pg';

dotenvConfig({ path: '.env' });

function buildClientConfig(): ClientConfig {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED;

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    };
  }

  return {
    host: 'localhost',
    port: 5432,
    user: process.env.DB_USER || process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || process.env.POSTGRES_DATABASE,
  };
}

async function run() {
  const client = new Client(buildClientConfig());
  await client.connect();
  console.log('Conectado a la BD.');

  const { rows: existing } = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'USERS' AND column_name = 'lastName'`,
  );

  if (existing.length === 0) {
    console.log('Agregando columna "lastName" con default temporal...');
    await client.query(
      `ALTER TABLE "USERS" ADD COLUMN "lastName" VARCHAR(100) NOT NULL DEFAULT 'SinApellido'`,
    );
    await client.query(
      `ALTER TABLE "USERS" ALTER COLUMN "lastName" DROP DEFAULT`,
    );
    console.log('Columna "lastName" creada y rellenada con "SinApellido".');
  } else {
    console.log('La columna "lastName" ya existe. Backfileando NULLs si los hay...');
    const result = await client.query(
      `UPDATE "USERS" SET "lastName" = 'SinApellido' WHERE "lastName" IS NULL`,
    );
    console.log(`Filas actualizadas: ${result.rowCount}`);
  }

  await client.end();
  console.log('Listo.');
}

run().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});
