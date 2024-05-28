export interface IExchangeRateInfo {
  code: string;
  currencyCode: string;
  basePrice: number;
  currencyUnit: number;
  fractionDigits: number;
}

export interface IPayload {
  username: string;
  userId: string;
}

export interface ISupportedCurrencyInfo {
  frxCode: string;
  currencyCode: string;
  fractionDigits: number;
  getServiceCharge: (amount: number) => number;
}

declare module 'express' {
  interface Request {
    user?: IPayload;
  }
}
