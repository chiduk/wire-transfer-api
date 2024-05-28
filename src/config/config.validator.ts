import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

export enum NODE_ENV {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

export const configValidator: ConfigModuleOptions = {
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid(NODE_ENV.PRODUCTION, NODE_ENV.DEVELOPMENT, NODE_ENV.TEST)
      .default(NODE_ENV.DEVELOPMENT),
    PORT: Joi.number().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION_TIME: Joi.string().required(),
    LOGS_PATH: Joi.string().required(),
  }),
  isGlobal: true,
  envFilePath:
    process.env.NODE_ENV === 'test'
      ? '.env.test'
      : process.env.NODE_ENV === 'prod'
        ? '.env.prod'
        : process.env.NODE_ENV === 'dev'
          ? '.env.dev'
          : '.env.dev',
};
