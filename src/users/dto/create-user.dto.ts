import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import {
  EXCEPTION_CODE,
  EXCEPTIONS,
} from '../../exception/exception.constants';

export class CreateUserDto {
  @IsEmail(undefined, {
    message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_EMAIL].resultMsg,
  })
  @IsNotEmpty({ message: EXCEPTIONS[EXCEPTION_CODE.EMPTY_USER_ID].resultMsg })
  userId: string;

  @IsString({ message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg })
  @IsNotEmpty({ message: EXCEPTIONS[EXCEPTION_CODE.EMPTY_USER_NAME].resultMsg })
  name: string;

  @IsString({ message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg })
  @Length(4, 8, {
    message: EXCEPTIONS[EXCEPTION_CODE.INCORRECT_PASSWORD_LENGTH].resultMsg,
  })
  password: string;

  @IsString({ message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg })
  @IsNotEmpty({ message: EXCEPTIONS[EXCEPTION_CODE.EMPTY_ID_TYPE].resultMsg })
  idType: string;

  @IsString({ message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg })
  @IsNotEmpty({ message: EXCEPTIONS[EXCEPTION_CODE.EMPTY_ID_VALUE].resultMsg })
  idValue: string;
}
