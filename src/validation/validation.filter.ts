import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const errors = (exceptionResponse as any).message;

    const resultMsg = errors
      .map((error: ValidationError) => {
        if (error) return error;
        return 'Validation failed';
      })
      .join(' ');

    response.status(status).json({
      resultCode: HttpStatus.BAD_REQUEST,
      resultMsg: resultMsg || 'Validation failed',
    });
  }
}
