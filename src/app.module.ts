import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configValidator } from './config/config.validator';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './typeOrm/typeOrm.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WireTransferModule } from './wireTransfer/wireTransfer.module';
import { LoggerModule } from './logger/logger.module';
import { WinstonLoggerService } from './logger/logger.service';
import { LoggerMiddleware } from './logger/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(configValidator),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    UsersModule,
    WireTransferModule,
    AuthModule,
    LoggerModule,
  ],
})
export class AppModule implements NestModule {
  constructor(private winstonLoggerService: WinstonLoggerService) {
    Logger.overrideLogger(this.winstonLoggerService);
  }

  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
