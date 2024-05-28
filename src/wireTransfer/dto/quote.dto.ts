import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import {
  EXCEPTION_CODE,
  EXCEPTIONS,
} from '../../exception/exception.constants';

export class QuoteDto {
  @IsNotEmpty({ message: EXCEPTIONS[EXCEPTION_CODE.EMPTY_ID_TYPE].resultMsg })
  @IsNumber(undefined, {
    message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_NUMBER].resultMsg,
  })
  amount: number;

  @IsString({ message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_STRING].resultMsg })
  @IsNotEmpty({ message: EXCEPTIONS[EXCEPTION_CODE.EMPTY_ID_TYPE].resultMsg })
  targetCurrency: string;
}
