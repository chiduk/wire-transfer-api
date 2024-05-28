import { IsNotEmpty, IsNumber } from 'class-validator';
import {
  EXCEPTION_CODE,
  EXCEPTIONS,
} from '../../exception/exception.constants';

export class RequestDto {
  @IsNotEmpty({ message: EXCEPTIONS[EXCEPTION_CODE.EMPTY_ID_TYPE].resultMsg })
  @IsNumber(undefined, {
    message: EXCEPTIONS[EXCEPTION_CODE.MUST_BE_NUMBER].resultMsg,
  })
  quoteId: number;
}
