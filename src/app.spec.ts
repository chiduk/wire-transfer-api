import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { initTestDB } from './test/initialize';
import * as request from 'supertest';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './app.module';
import { ValidationExceptionFilter } from './validation/validation.filter';
import { EXCEPTION_CODE, EXCEPTIONS } from './exception/exception.constants';
import { LogInDto } from './users/dto/login-user.dto';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from './users/user.entity';
import { CreateUserDto } from './users/dto/create-user.dto';
import { UsersService } from './users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WireTransferService } from './wireTransfer/wireTransfer.service';
import { UsersRepository } from './users/users.repository';
import { WireTransferRepository } from './wireTransfer/wireTransfer.repository';
import { WireTransfer } from './wireTransfer/wireTransfer.entity';

describe('모인 코딩 과제 테스트', () => {
  let mockApp: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;
  let jwtToken: string;
  let personalUserJwtToken: string;

  const user = new CreateUserDto();
  user.name = '홍길동';
  user.password = '1234';
  user.userId = 'abc@example.com';
  user.idType = 'BUSINESS_NO';
  user.idValue = '1220102-1020345';

  const personalUser = new CreateUserDto();
  personalUser.name = '김철수';
  personalUser.password = '1234';
  personalUser.userId = 'qwer@example.com';
  personalUser.idType = 'REG_NO';
  personalUser.idValue = '230908-2020444';

  beforeAll(async () => {
    await initTestDB();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        HttpModule,
        TypeOrmModule.forFeature([
          User,
          UsersRepository,
          WireTransfer,
          WireTransferRepository,
        ]),
      ],
      providers: [
        JwtService,
        AuthService,
        UsersService,
        WireTransferService,
        UsersRepository,
        WireTransferRepository,
      ],
    }).compile();

    const usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
    dataSource = module.get<DataSource>(DataSource);
    mockApp = module.createNestApplication();
    mockApp.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          const messages = errors.map((error) => {
            if (error.constraints)
              return Object.values(error.constraints).join(' ');
            return 'Validation Failed';
          });
          return new BadRequestException(messages);
        },
      }),
    );
    mockApp.useGlobalFilters(new ValidationExceptionFilter());
    await mockApp.init();

    jwtToken = await authService.signJwtToken({
      username: user.name,
      userId: user.userId,
    });

    personalUserJwtToken = await authService.signJwtToken({
      username: personalUser.name,
      userId: personalUser.userId,
    });

    await usersService.create(personalUser);
  });

  afterAll(async () => {
    await dataSource.dropDatabase();
    await dataSource.synchronize();
    await dataSource.destroy();
    await mockApp.close();
  });

  describe('/user PATH 테스트', () => {
    describe('/user/signup', () => {
      it('비밀번호 길이가 4 보다 짧으면 400 코드 응답', async () => {
        const newUser: any = {};
        newUser.name = user.name;
        newUser.password = '1';
        newUser.userId = user.userId;
        newUser.idType = user.idType;
        newUser.idValue = user.idValue;

        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(newUser)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              EXCEPTIONS[EXCEPTION_CODE.INCORRECT_PASSWORD_LENGTH].resultMsg,
            );
          });
      });

      it('비밀번호 길이가 8 보다 길면 400 코드 응답', async () => {
        const newUser: any = {};
        newUser.name = user.name;
        newUser.password = '123456789';
        newUser.userId = user.userId;
        newUser.idType = user.idType;
        newUser.idValue = user.idValue;

        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(newUser)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              EXCEPTIONS[EXCEPTION_CODE.INCORRECT_PASSWORD_LENGTH].resultMsg,
            );
          });
      });

      it('새로운 개인 사용자 생성시 name이 빠졌을때 400 코드 응답', async () => {
        const newUser: any = {};
        newUser.password = user.password;
        newUser.userId = user.userId;
        newUser.idType = user.idType;
        newUser.idValue = user.idValue;

        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(newUser)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.EMPTY_USER_NAME].resultMsg} ${EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg}`,
            );
          });
      });

      it('새로운 개인 사용자 생성시 password가 빠졌을때 400 코드 응답', async () => {
        const newUser: any = {};
        newUser.name = user.name;
        newUser.userId = user.userId;
        newUser.idType = user.idType;
        newUser.idValue = user.idValue;

        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(newUser)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.INCORRECT_PASSWORD_LENGTH].resultMsg} ${EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg}`,
            );
          });
      });

      it('새로운 개인 사용자 생성시 userId가 빠졌을때 400 코드 응답', async () => {
        const newUser: any = {};
        newUser.name = user.name;
        newUser.password = user.password;
        newUser.idType = user.idType;
        newUser.idValue = user.idValue;

        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(newUser)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.EMPTY_USER_ID].resultMsg} ${EXCEPTIONS[EXCEPTION_CODE.MUST_BE_EMAIL].resultMsg}`,
            );
          });
      });

      it('새로운 개인 사용자 생성시 idType이 빠졌을때 400 코드 응답', async () => {
        const newUser: any = {};
        newUser.name = user.name;
        newUser.password = user.password;
        newUser.userId = user.userId;
        newUser.idValue = user.idValue;

        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(newUser)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.EMPTY_ID_TYPE].resultMsg} ${EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg}`,
            );
          });
      });

      it('새로운 개인 사용자 생성시 idValue가 빠졌을때 400 코드 응답', async () => {
        const newUser: any = {};
        newUser.name = user.name;
        newUser.password = user.password;
        newUser.userId = user.userId;
        newUser.idType = user.idType;

        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(newUser)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.EMPTY_ID_VALUE].resultMsg} ${EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg}`,
            );
          });
      });

      it('새로운 개인 사용자 생성', async () => {
        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(user)
          .expect(201);
      });

      it('중복 이메일 주소 존재시 400 응답코드', async () => {
        return request(mockApp.getHttpServer())
          .post('/user/signup')
          .send(user)
          .expect(400);
      });
    });

    describe('/user/login', () => {
      it('userId가 빠졌을때 400 코드 응답', async () => {
        const login: any = {};
        login.password = '1234';

        return request(mockApp.getHttpServer())
          .post('/user/login')
          .send(login)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.EMPTY_USER_ID].resultMsg} ${EXCEPTIONS[EXCEPTION_CODE.MUST_BE_EMAIL].resultMsg}`,
            );
          });
      });

      it('password가 빠졌을때 400 코드 응답', async () => {
        const login: any = {};
        login.userId = user.userId;

        return request(mockApp.getHttpServer())
          .post('/user/login')
          .send(login)
          .expect(400)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.INCORRECT_PASSWORD_LENGTH].resultMsg} ${EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg}`,
            );
          });
      });

      it('틀린 userId 일때 404 코드 응답', () => {
        const loginDto = new LogInDto();
        loginDto.userId = 'fge@example.com';
        loginDto.password = user.password;

        return request(mockApp.getHttpServer())
          .post('/user/login')
          .send(loginDto)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(404);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.USER_NOT_FOUND].resultMsg}`,
            );
          });
      });

      it('틀린 password 일때 400 코드 응답', () => {
        const loginDto = new LogInDto();
        loginDto.userId = user.userId;
        loginDto.password = '123e4';

        return request(mockApp.getHttpServer())
          .post('/user/login')
          .send(loginDto)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(400);
            expect(body.resultMsg).toBe(
              `${EXCEPTIONS[EXCEPTION_CODE.NOT_MATCHING].resultMsg}`,
            );
          });
      });

      it('로그인 성공', () => {
        const loginDto = new LogInDto();
        loginDto.userId = user.userId;
        loginDto.password = user.password;

        return request(mockApp.getHttpServer())
          .post('/user/login')
          .send(loginDto)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(200);
            expect(body.resultMsg).toBe('OK');
            expect(body.token).not.toBeNull();
          });
      });
    });
  });

  describe('/transfer PATH 테스트', () => {
    describe('/transfer/quote', () => {
      it('Token 없이 요청 보내면 Unauthorized 에러 응답', () => {
        const requestBody = {
          userId: user.userId,
          amount: 10000,
          targetCurrency: 'USD',
        };

        return request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .send(requestBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.UNAUTHORIZED);
          });
      });

      it('음수 금액 요청시 400 에러 응답', () => {
        const requestBody = {
          amount: -10000,
          targetCurrency: 'USD',
        };

        return request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(jwtToken, { type: 'bearer' })
          .send(requestBody)
          .expect(400);
      });

      it('견적서 요청 성공', () => {
        const requestBody = {
          amount: 10000,
          targetCurrency: 'USD',
        };

        return request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(jwtToken, { type: 'bearer' })
          .send(requestBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.OK);
            expect(body.quote.quoteId).toBeDefined();
            expect(body.quote.exchangeRate).toBeDefined();
            expect(body.quote.expireTime).toBeDefined();
            expect(body.quote.targetAmount).toBeDefined();
          });
      });
    });
    describe('/transfer/request', () => {
      it('Token 없이 요청 보내면 Unauthorized 에러 응답', () => {
        const requestBody = {
          quoteId: 1,
        };

        return request(mockApp.getHttpServer())
          .post('/transfer/request')
          .send(requestBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.UNAUTHORIZED);
          });
      });

      it('송금 요청 성공', () => {
        const requestBody = {
          quoteId: 1,
        };

        return request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(jwtToken, { type: 'bearer' })
          .send(requestBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.OK);
          });
      });

      it('법인 사용자 일일 송금 한도 초과 시 400 에러코드 응답', async () => {
        const requestBody = {
          amount: 9000000,
          targetCurrency: 'USD',
        };

        const response = await request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(jwtToken, { type: 'bearer' })
          .send(requestBody);

        const quote = response.body.quote;
        const quoteIdBody = {
          quoteId: quote.quoteId,
        };

        return request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(jwtToken, { type: 'bearer' })
          .send(quoteIdBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.BAD_REQUEST);
            expect(body.resultMsg).toBe(
              EXCEPTIONS[EXCEPTION_CODE.LIMIT_EXCESS].resultMsg,
            );
          });
      });

      it('개인 사용자 일일 송금 한도 초과 시 400 에러코드 응답', async () => {
        const requestBody = {
          amount: 9000000,
          targetCurrency: 'USD',
        };

        const response = await request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(requestBody);

        const quote = response.body.quote;
        const quoteIdBody = {
          quoteId: quote.quoteId,
        };

        return request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(quoteIdBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.BAD_REQUEST);
            expect(body.resultMsg).toBe(
              EXCEPTIONS[EXCEPTION_CODE.LIMIT_EXCESS].resultMsg,
            );
          });
      });

      it('견적서 만료 시 400 에러코드 응답', async () => {
        const requestBody = {
          amount: 100000,
          targetCurrency: 'USD',
        };

        const response = await request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(requestBody);

        const quote = response.body.quote;
        const quoteIdBody = {
          quoteId: quote.quoteId,
        };

        await request(mockApp.getHttpServer())
          .post('/transfer/expire')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(quoteIdBody);

        return request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(quoteIdBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.BAD_REQUEST);
            expect(body.resultMsg).toBe(
              EXCEPTIONS[EXCEPTION_CODE.QUOTE_EXPIRED].resultMsg,
            );
          });
      });

      it('견적서 재사용시 400 에러코드 응답', async () => {
        const requestBody = {
          amount: 100000,
          targetCurrency: 'USD',
        };

        const response = await request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(requestBody);

        const quote = response.body.quote;
        const quoteIdBody = {
          quoteId: quote.quoteId,
        };

        await request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(quoteIdBody);

        return request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(personalUserJwtToken, { type: 'bearer' })
          .send(quoteIdBody)
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.BAD_REQUEST);
            expect(body.resultMsg).toBe(
              EXCEPTIONS[EXCEPTION_CODE.ALREADY_WIRED].resultMsg,
            );
          });
      });
    });
    describe('/transfer/list', () => {
      it('Token 없이 요청 보내면 Unauthorized 에러 응답', () => {
        return request(mockApp.getHttpServer())
          .get('/transfer/list')
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.UNAUTHORIZED);
          });
      });

      it('회원 거래 이력 요청 성공', async () => {
        const jpyQuoteBody = {
          amount: 2000000,
          targetCurrency: 'JPY',
        };

        const usdQuoteBody = {
          amount: 1000000,
          targetCurrency: 'USD',
        };

        const response = await request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(jwtToken, { type: 'bearer' })
          .send(jpyQuoteBody);

        const quote = response.body.quote;
        const quoteIdBody = {
          quoteId: quote.quoteId,
        };

        await request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(jwtToken, { type: 'bearer' })
          .send(quoteIdBody);

        const usdResponse = await request(mockApp.getHttpServer())
          .post('/transfer/quote')
          .auth(jwtToken, { type: 'bearer' })
          .send(usdQuoteBody);
        const usdQuoteId = usdResponse.body.quote.quoteId;
        const usdQuoteIdBody = {
          quoteId: usdQuoteId,
        };
        await request(mockApp.getHttpServer())
          .post('/transfer/request')
          .auth(jwtToken, { type: 'bearer' })
          .send(usdQuoteIdBody);

        return request(mockApp.getHttpServer())
          .get('/transfer/list')
          .auth(jwtToken, { type: 'bearer' })
          .expect(({ body }) => {
            expect(body.resultCode).toBe(HttpStatus.OK);
            expect(body.todayTransferCount).toBe(3);
            expect(body.history.length).toBe(3);
          });
      });
    });
  });
});
