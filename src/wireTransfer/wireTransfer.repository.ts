import { Injectable, Logger } from '@nestjs/common';
import { Equal, Repository } from 'typeorm';
import { WireTransfer } from './wireTransfer.entity';
import { QuoteDto } from './dto/quote.dto';
import { ACTION_CODE } from '../logger/logger.constants';
import { EXCEPTION_CODE, EXCEPTIONS } from '../exception/exception.constants';
import {
  CURRENCY,
  FIXED_USER_FEE,
  getCurrencyExchangeRateInfoUrl,
  ID_TYPE_WIRE_AMOUNT_LIMIT,
  QUOTE_VALID_TIME,
  SUPPORTED_CURRENCY,
} from './wireTransfer.constants';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { IExchangeRateInfo } from './wireTransfer.interfaces';
import { ThrowHttpException } from '../exception/exception.errors';
import { HttpService } from '@nestjs/axios';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WireTransferRepository {
  private readonly logger = new Logger(WireTransferRepository.name);
  constructor(
    @InjectRepository(WireTransfer)
    private repository: Repository<WireTransfer>,
    private usersRepository: UsersRepository,
    private httpService: HttpService,
    private usersService: UsersService,
  ) {}

  async getQuote(userId: string, quoteDto: QuoteDto) {
    const rates = await this.getExchangeRates();

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.USER_NOT_FOUND]);
    }

    const serviceFee = this.getServiceFee(
      user.idType,
      quoteDto.amount,
      quoteDto.targetCurrency,
    );

    const usdAmount = this.getExchangedAmount(
      quoteDto.amount,
      rates[CURRENCY.USD],
    );

    const targetAmount = this.getExchangedAmount(
      quoteDto.amount - serviceFee,
      rates[quoteDto.targetCurrency],
    );

    const wireTransfer = new WireTransfer();
    wireTransfer.quoteExpirationTime = new Date(
      new Date().getTime() + QUOTE_VALID_TIME,
    );
    wireTransfer.sourceAmount = quoteDto.amount;
    wireTransfer.fee = serviceFee;
    wireTransfer.usdExchangeRate = rates[CURRENCY.USD].basePrice;
    wireTransfer.usdAmount = usdAmount;
    wireTransfer.targetCurrency = quoteDto.targetCurrency;
    wireTransfer.exchangeRate = rates[quoteDto.targetCurrency].basePrice;
    wireTransfer.targetAmount = targetAmount;
    wireTransfer.requestedDate = null;
    wireTransfer.isWired = false;
    wireTransfer.user = user;

    try {
      const result = await this.repository.save(wireTransfer);

      return {
        quoteId: result.id,
        exchangeRate: result.exchangeRate,
        expireTime: result.quoteExpirationTime,
        targetAmount: result.targetAmount,
      };
    } catch (error) {
      console.error(error);
    }
  }

  async requestWireTransfer(userId: string, quoteId: number) {
    //견적서 만료 체크
    if (!(await this.isQuoteValid(quoteId)))
      return Promise.reject(Error(EXCEPTION_CODE.QUOTE_EXPIRED));

    //송금 완료된 견적서인지 체크
    if (await this.isAlreadyWired(quoteId))
      return Promise.reject(Error(EXCEPTION_CODE.ALREADY_WIRED));

    //일일 송금 금액 제한 체크
    if (await this.isLimitExceeded(userId, quoteId))
      return Promise.reject(Error(EXCEPTION_CODE.LIMIT_EXCESS));

    return this.repository.update(quoteId, {
      requestedDate: new Date(),
      isWired: true,
    });
  }

  async getWireTransferHistory(userId: string) {
    const userRepoQueryBuilder =
      await this.usersRepository.getQueryBuilder('user');

    const userAndHistory = await userRepoQueryBuilder
      .leftJoinAndSelect('user.wireTransfers', 'wireTransfer')
      .where('user.userId = :userId', { userId })
      .andWhere('wireTransfer.isWired = true')
      .orderBy('wireTransfer.requestedDate', 'DESC')
      .getOne();

    if (!userAndHistory) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_LIST_FAIL,
        params: { userId },
        error: { message: 'RECORDS_NOT_FOUND' },
      });

      return Promise.reject(
        Error(EXCEPTIONS[EXCEPTION_CODE.RECORD_NOT_FOUND].resultMsg),
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0);

    const todayRecords = userAndHistory.wireTransfers.filter((transfer) => {
      return transfer.requestedDate ? transfer.requestedDate >= today : false;
    });
    const todayTransferCount = todayRecords.length;
    const todayTransferUsdAmount = todayRecords.reduce(
      (total, wire) => total + wire.usdAmount,
      0,
    );

    const history = todayRecords.map((record) => ({
      sourceAmount: record.sourceAmount,
      fee: record.fee,
      usdExchangeRate: record.usdExchangeRate,
      usdAmount: record.usdAmount,
      targetCurrency: record.targetCurrency,
      exchangeRate: record.exchangeRate,
      targetAmount: record.targetAmount,
      requestedDate: record.requestedDate
        ? this.formatDate(record.requestedDate)
        : null,
    }));

    return {
      userId: userAndHistory.userId,
      name: userAndHistory.name,
      todayTransferCount,
      todayTransferUsdAmount,
      history,
    };
  }

  private formatDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    };

    const formatter = new Intl.DateTimeFormat('ko-KR', options);
    const parts = formatter.formatToParts(date);

    let year, month, day, hour, minute, second;
    parts.map((part) => {
      switch (part.type) {
        case 'year':
          year = part.value.padStart(2, '0');
          break;
        case 'month':
          month = part.value.padStart(2, '0');
          break;
        case 'day':
          day = part.value.padStart(2, '0');
          break;
        case 'hour':
          hour = part.value.padStart(2, '0');
          break;
        case 'minute':
          minute = part.value.padStart(2, '0');
          break;
        case 'second':
          second = part.value.padStart(2, '0');
          break;
        default:
          return part.value;
      }
    });

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  private async isQuoteValid(quoteId: number) {
    try {
      const quote = await this.repository.findOneBy({
        id: Equal(quoteId),
      });

      const currentTime = new Date();
      if (
        quote?.quoteExpirationTime &&
        currentTime > quote?.quoteExpirationTime
      ) {
        return false;
      }
    } catch (error) {}

    return true;
  }

  private async isAlreadyWired(quoteId: number) {
    const wireTransfer = await this.repository.findOneBy({
      id: Equal(quoteId),
    });
    if (!wireTransfer) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_IS_ALREADY_WIRED,
        params: { quoteId: quoteId },
        error: {
          message: EXCEPTIONS[EXCEPTION_CODE.QUOTE_NOT_FOUND].resultMsg,
        },
      });

      return Promise.reject(
        Error(EXCEPTIONS[EXCEPTION_CODE.QUOTE_NOT_FOUND].resultMsg),
      );
    }

    return wireTransfer.isWired;
  }

  private async isLimitExceeded(userId: string, quoteId: number) {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user)
        return Promise.reject(
          Error(EXCEPTIONS[EXCEPTION_CODE.USER_NOT_FOUND].resultMsg),
        );
      const quote = await this.repository.findOneBy({
        id: Equal(quoteId),
      });
      const today = new Date();
      const result = await this.repository
        .createQueryBuilder('wt')
        .select('COALESCE(SUM(wt.usdAmount), 0)', 'totalUsdAmount')
        .where('wt.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM wt.requestedDate) = :year', {
          year: today.getFullYear(),
        })
        .andWhere('EXTRACT(MONTH FROM wt.requestedDate) = :month', {
          month: today.getMonth() + 1,
        })
        .andWhere('EXTRACT(DAY FROM wt.requestedDate) = :day', {
          day: today.getDate(),
        })
        .getRawOne();

      const totalAmount = result.totalUsdAmount + quote?.usdAmount;
      return totalAmount > ID_TYPE_WIRE_AMOUNT_LIMIT[user.idType];
    } catch (error) {
      this.logger.error({
        action: ACTION_CODE.WIRE_TRANSFER_IS_LIMIT_EXCEEDED_ERROR,
        params: { userId, quoteId },
        error: error,
      });

      throw new Error(error);
    }
  }

  private async getExchangeRates() {
    const { data } = await firstValueFrom(
      this.httpService
        .get<AxiosResponse<any, any>>(getCurrencyExchangeRateInfoUrl())
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response?.data);
            throw 'An error happened!';
          }),
        ),
    );

    if (Array.isArray(data)) {
      const dataArray: any[] = data;
      const rates: Record<string, IExchangeRateInfo> = {};
      dataArray.forEach((rate: IExchangeRateInfo) => {
        rates[rate.currencyCode] = {
          code: rate.code,
          currencyCode: rate.currencyCode,
          basePrice: rate.basePrice,
          currencyUnit: rate.currencyUnit,
          fractionDigits: SUPPORTED_CURRENCY[rate.currencyCode].fractionDigits,
        };
      });

      return rates;
    } else {
      throw ThrowHttpException(
        EXCEPTIONS[EXCEPTION_CODE.INTERNAL_SERVER_ERROR],
      );
    }
  }

  private getServiceFee(userType: string, amount: number, currency: string) {
    const fixedFee = FIXED_USER_FEE[userType];
    const serviceCharge = SUPPORTED_CURRENCY[currency].getServiceCharge(amount);
    return fixedFee + serviceCharge;
  }

  private getExchangedAmount(amount: number, rateInfo: IExchangeRateInfo) {
    const convertedAmount = (
      (amount * rateInfo.currencyUnit) /
      rateInfo.basePrice
    ).toFixed(rateInfo.fractionDigits);
    return parseFloat(convertedAmount);
  }

  async expireQuote(quoteId: number) {
    const quote = await this.repository.findOneBy({
      id: Equal(quoteId),
    });

    const newQuoteExpireTime = quote?.quoteExpirationTime
      ? quote?.quoteExpirationTime.getTime() - QUOTE_VALID_TIME
      : new Date().getTime() - QUOTE_VALID_TIME;

    return await this.repository.update(quoteId, {
      quoteExpirationTime: new Date(newQuoteExpireTime),
    });
  }
}
