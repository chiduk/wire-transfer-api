import { HttpException, HttpExceptionOptions } from '@nestjs/common';
import { IResponseBody } from './exception.interfaces';

export const ThrowHttpException = (
  response: IResponseBody,
  options?: HttpExceptionOptions,
) => {
  throw new HttpException(response, response.resultCode, options);
};
