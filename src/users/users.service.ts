import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LogInDto } from './dto/login-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.usersRepository.saveUser(createUserDto);
  }

  async logIn(logInDto: LogInDto) {
    return await this.usersRepository.logIn(logInDto);
  }

  async findOne(userId: string) {
    return await this.usersRepository.findOneBy(userId);
  }
}
