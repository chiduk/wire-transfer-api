import { ThrowHttpException } from '../exception/exception.errors';
import { EXCEPTION_CODE, EXCEPTIONS } from '../exception/exception.constants';
import { ISupportedCurrencyInfo } from './wireTransfer.interfaces';

export const QUOTE_VALID_TIME = 600000;

export const FIXED_USER_FEE: Record<string, number> = {
  REG_NO: 1000,
  BUSINESS_NO: 3000,
};

export const ID_TYPE_WIRE_AMOUNT_LIMIT: Record<string, number> = {
  REG_NO: 1000,
  BUSINESS_NO: 5000,
};
export const CURRENCY: Record<string, string> = {
  JPY: 'JPY',
  USD: 'USD',
};

export const SUPPORTED_CURRENCY: Record<string, ISupportedCurrencyInfo> = {
  USD: {
    frxCode: 'FRX.KRWUSD',
    currencyCode: 'USD',
    fractionDigits: 2,
    getServiceCharge: (amount: number) => {
      let serviceCharge = 0;
      if (amount >= 1 && amount <= 1000000) {
        serviceCharge = amount * (0.2 / 100);
      } else if (amount > 1000000) {
        serviceCharge = amount * (0.1 / 100);
      } else {
        throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.NEGATIVE_NUMBER]);
      }
      return serviceCharge;
    },
  },
  JPY: {
    frxCode: 'FRX.KRWJPY',
    currencyCode: 'JPY',
    fractionDigits: 2,
    getServiceCharge: (amount: number) => {
      let serviceCharge = 0;
      if (amount >= 1) {
        serviceCharge = amount * (0.5 / 100);
      } else {
        throw ThrowHttpException(EXCEPTIONS[EXCEPTION_CODE.NEGATIVE_NUMBER]);
      }
      return serviceCharge;
    },
  },
};

export const getCurrencyExchangeRateInfoUrl = () => {
  let joinedCode = '';
  for (const [, value] of Object.entries(SUPPORTED_CURRENCY)) {
    joinedCode += `,${value.frxCode}`;
  }

  return `https://quotation-api-cdn.dunamu.com:443/v1/forex/recent?codes=,${joinedCode}`;
};
