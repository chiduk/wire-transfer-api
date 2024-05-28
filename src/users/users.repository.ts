import { Equal, Repository } from 'typeorm';
import { User } from './user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { LogInDto } from './dto/login-user.dto';
import { AuthService } from '../auth/auth.service';
import { ACTION_CODE } from '../logger/logger.constants';
import { EXCEPTION_CODE, EXCEPTIONS } from '../exception/exception.constants';
import { ThrowHttpException } from '../exception/exception.errors';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersRepository {
  private saltRounds = 10;
  private readonly logger = new Logger(UsersRepository.name);
  constructor(
    private authService: AuthService,
    @InjectRepository(User) private repository: Repository<User>,
  ) {}

  public async saveUser(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    user.userId = createUserDto.userId;
    user.name = createUserDto.name;
    user.password = await bcrypt.hash(createUserDto.password, this.saltRounds);
    user.idType = createUserDto.idType;
    user.idValue = await bcrypt.hash(createUserDto.idValue, this.saltRounds);

    return this.repository.save(user);
  }

  public async logIn(logInDto: LogInDto) {
    const user = await this.repository.findOneBy({
      userId: Equal(logInDto.userId),
    });

    if (!user) {
      this.logger.error({
        action: ACTION_CODE.USER_LOGIN_FAIL,
        params: {
          userId: logInDto.userId,
        },
        error: { message: EXCEPTIONS[EXCEPTION_CODE.USER_NOT_FOUND].resultMsg },
      });

      return ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.USER_NOT_FOUND]);
    }

    const isMatching = await bcrypt.compare(logInDto.password, user.password);

    if (!isMatching) {
      this.logger.error({
        action: ACTION_CODE.USER_LOGIN_FAIL,
        params: {
          userId: logInDto.userId,
        },
        error: { message: EXCEPTIONS[EXCEPTION_CODE.NOT_MATCHING].resultMsg },
      });

      return ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.NOT_MATCHING]);
    }

    const token = await this.authService.signJwtToken({
      username: user.name,
      userId: user.userId,
    });

    await this.repository
      .createQueryBuilder()
      .update()
      .set({ token: token })
      .where({ userId: Equal(logInDto.userId) })
      .execute();

    return this.authService.signJwtToken({
      username: user?.name,
      userId: user?.userId,
    });
  }

  public async findOneBy(userId: string) {
    return this.repository.findOneBy({ userId: Equal(userId) });
  }

  public async getQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias);
  }
}
