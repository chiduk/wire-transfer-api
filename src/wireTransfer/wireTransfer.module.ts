import { Module } from '@nestjs/common';
import { WireTransferService } from './wireTransfer.service';
import { WireTransferController } from './wireTransfer.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WireTransfer } from './wireTransfer.entity';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { WireTransferRepository } from './wireTransfer.repository';
import { UsersRepository } from '../users/users.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WireTransfer,
      WireTransferRepository,
      User,
      UsersRepository,
    ]),
    HttpModule,
    AuthModule,
    UsersModule,
  ],
  providers: [WireTransferService, WireTransferRepository],
  controllers: [WireTransferController],
  exports: [WireTransferService, WireTransferRepository],
})
export class WireTransferModule {}
