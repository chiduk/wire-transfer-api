import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { WireTransferService } from './wireTransfer.service';
import { QuoteDto } from './dto/quote.dto';
import { Response, Request } from 'express';
import { RequestDto } from './dto/request.dto';
import { ThrowHttpException } from '../exception/exception.errors';
import { EXCEPTION_CODE, EXCEPTIONS } from '../exception/exception.constants';
import { ACTION_CODE } from '../logger/logger.constants';

@UseGuards(AuthGuard)
@Controller('transfer')
export class WireTransferController {
  private readonly logger = new Logger(WireTransferController.name);
  constructor(private transferService: WireTransferService) {}

  @Post('quote')
  async getQuote(
    @Body() quoteDto: QuoteDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = req.user?.userId;

    this.logger.log({
      action: ACTION_CODE.WIRE_TRANSFER_QUOTE,
      params: { userId, ...quoteDto },
    });

    if (!userId) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_QUOTE_FAIL,
        params: { userId, ...quoteDto },
        error: { message: EXCEPTIONS[EXCEPTION_CODE.INVALID_TOKEN].resultMsg },
      });

      throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.INVALID_TOKEN]);
    }

    if (quoteDto.amount < 0) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_QUOTE_FAIL,
        params: { userId, ...quoteDto },
        error: {
          message: EXCEPTIONS[EXCEPTION_CODE.NEGATIVE_NUMBER].resultMsg,
        },
      });

      throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.NEGATIVE_NUMBER]);
    }

    try {
      const quote = await this.transferService.getQuote(userId, quoteDto);

      this.logger.log({
        action: ACTION_CODE.WIRE_TRANSFER_QUOTE_SUCCESS,
        params: { userId, ...quoteDto },
      });

      res.json({
        resultCode: HttpStatus.OK,
        resultMsg: 'OK',
        quote,
      });
    } catch (error) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_QUOTE_ERROR,
        params: { userId, ...quoteDto },
        error: error,
      });

      throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.WRONG_PARAMETER]);
    }
  }

  @Post('request')
  async requestWireTransfer(
    @Body() requestDto: RequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = req.user?.userId;

    this.logger.log({
      action: ACTION_CODE.WIRE_TRANSFER_REQUEST,
      params: { userId, ...requestDto },
    });

    if (!userId) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_REQUEST_FAIL,
        params: { userId, ...requestDto },
        error: { message: EXCEPTIONS[EXCEPTION_CODE.INVALID_TOKEN].resultMsg },
      });

      throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.INVALID_TOKEN]);
    }

    try {
      await this.transferService.requestWireTransfer(
        userId,
        requestDto.quoteId,
      );

      this.logger.log({
        action: ACTION_CODE.WIRE_TRANSFER_REQUEST_SUCCESS,
        params: { userId, ...requestDto },
      });

      res.json({
        resultCode: HttpStatus.OK,
        resultMsg: 'OK',
      });
    } catch (error) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_REQUEST_ERROR,
        params: { userId, ...requestDto },
        error: { message: error.message },
      });

      throw ThrowHttpException(EXCEPTIONS[error.message]);
    }
  }

  @Get('list')
  async getWireTransferHistory(@Req() req: Request, @Res() res: Response) {
    const userId = req.user?.userId;

    this.logger.log({
      action: ACTION_CODE.WIRE_TRANSFER_LIST,
      params: { userId },
    });

    if (!userId) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_LIST_FAIL,
        params: { userId },
        error: { message: EXCEPTIONS[EXCEPTION_CODE.INVALID_TOKEN].resultMsg },
      });

      throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.INVALID_TOKEN]);
    }

    try {
      const result = await this.transferService.getWireTransferHistory(userId);

      this.logger.log({
        action: ACTION_CODE.WIRE_TRANSFER_LIST_SUCCESS,
        params: { userId },
      });

      res.json({
        resultCode: HttpStatus.OK,
        resultMsg: 'OK',
        ...result,
      });
    } catch (error) {}
  }

  @Post('expire')
  async expireQuote(
    @Body() quoteId: RequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = req.user?.userId;

    this.logger.log({
      action: ACTION_CODE.WIRE_TRANSFER_EXPIRE_QUOTE,
      params: { userId, quoteId },
    });

    await this.transferService.expireQuote(quoteId.quoteId);

    res.json({ resultCode: HttpStatus.OK, resultMsg: 'OK' });
  }
}
