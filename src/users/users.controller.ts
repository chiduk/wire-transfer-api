import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LogInDto } from './dto/login-user.dto';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { ThrowHttpException } from '../exception/exception.errors';
import { EXCEPTION_CODE, EXCEPTIONS } from '../exception/exception.constants';
import { ACTION_CODE } from '../logger/logger.constants';

@Controller('user')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('signup')
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    this.logger.log({
      action: ACTION_CODE.USER_CREATE,
      params: {
        userId: createUserDto.userId,
        name: createUserDto.name,
        idType: createUserDto.idType,
      },
    });

    try {
      await this.usersService.create(createUserDto);

      this.logger.log({
        action: ACTION_CODE.USER_CREATE_SUCCESS,
        params: {
          userId: createUserDto.userId,
          name: createUserDto.name,
          idType: createUserDto.idType,
        },
      });

      res.json({ resultCode: 200, resultMsg: 'OK' });
    } catch (error) {
      this.logger.error({
        action: ACTION_CODE.USER_CREATE_ERROR,
        params: {
          userId: createUserDto.userId,
          name: createUserDto.name,
          idType: createUserDto.idType,
        },
        error: error,
      });

      ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.WRONG_PARAMETER], {
        cause: error,
      });
    }
  }

  @Public()
  @Post('login')
  async logIn(@Body() logInDto: LogInDto, @Res() res: Response) {
    this.logger.log(`Log in - userId: ${logInDto.userId}`);
    this.logger.log({
      action: ACTION_CODE.USER_LOGIN,
      params: {
        userId: logInDto.userId,
      },
    });
    try {
      const token = await this.usersService.logIn(logInDto);
      if (token) {
        this.logger.log({
          action: ACTION_CODE.USER_LOGIN_SUCCESS,
          params: {
            userId: logInDto.userId,
          },
        });
      } else {
        this.logger.log({
          action: ACTION_CODE.USER_LOGIN_FAIL,
          params: {
            userId: logInDto.userId,
          },
        });
      }

      res.json({ resultCode: 200, resultMsg: 'OK', token: token });
    } catch (error) {
      this.logger.error({
        action: ACTION_CODE.USER_LOGIN_ERROR,
        params: {
          userId: logInDto.userId,
        },
        error: error,
      });

      ThrowHttpException(error.response, {
        cause: error,
      });
    }
  }
}
