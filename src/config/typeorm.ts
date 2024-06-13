//! Archivo de configuración casi siempre es un coy paste ( la estructura va ser la misma )

import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
dotenvConfig({ path: '.env' });
const config = {
  type: 'postgres',
  host:  `localhost`,
  port:  5432,
  username: `${process.env.DB_USER}`,
  password: `${process.env.POSTGRES_PASSWORD}`,
  database: `${process.env.POSTGRES_DB}`,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  
//   autoLoadEntities: true,
  // synchronize: true,
  // dropSchema: true,
   

};
export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
