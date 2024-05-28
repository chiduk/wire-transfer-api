export interface IResponseBody {
  resultCode: number;
  resultMsg: string;
}

export interface IExceptions {
  code: string;
  responseBody: IResponseBody;
}
