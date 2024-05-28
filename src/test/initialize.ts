import { DataSource, DataSourceOptions } from 'typeorm';
import { WireTransfer } from '../wireTransfer/wireTransfer.entity';
import { User } from '../users/user.entity';
import * as process from 'process';
import 'dotenv-flow/config';

export const DATA_SOURCE = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: [User, WireTransfer],
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5433,
} as DataSourceOptions);

export const getInitializedDataSource = (): Promise<DataSource> => {
  return DATA_SOURCE.initialize();
};

export const initTestDB = async () => {
  try {
    const datasource = await getInitializedDataSource();
    await datasource.synchronize();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
