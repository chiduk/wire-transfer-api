import { Injectable, LoggerService } from '@nestjs/common';
import { Logger, createLogger, format, transports } from 'winston';
import { utilities } from 'nest-winston';
import * as WinstonDaily from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';

interface LoggingInfo {
  level: string;
  message: string;
  timestamp?: string;
  code?: string;
  stack?: string;
}

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logsDir: string | undefined;

  private commonFormat = format.combine(
    utilities.format.nestLike('API', { prettyPrint: true }),
    format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
    format.colorize(),
    format.printf(
      (info: LoggingInfo) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  );

  private dailyOptions = (level: string) => {
    return {
      level,
      datePattern: 'YYYY-MM-DD',
      dirname: `${this.logsDir}/${level}`,
      filename: `%DATE%.${level}.log`,
      maxSize: '30m',
      maxFiles: 30,
      zippedArchive: true,
      format: format.combine(this.commonFormat, format.uncolorize()),
    };
  };

  private readonly logger: Logger;
  constructor(private configService: ConfigService) {
    this.logsDir = configService.get('LOGS_PATH');

    this.logger = createLogger({
      transports: [
        new transports.Console({
          format: format.combine(this.commonFormat),
          stderrLevels: ['error'],
        }),
        new WinstonDaily(this.dailyOptions('info')),
        new WinstonDaily(this.dailyOptions('error')),
      ],
    });
  }
  error(message: any, ...optionalParams: any[]): any {
    this.logger.error(JSON.stringify(message), ...optionalParams);
  }

  log(message: any, ...optionalParams: any[]): any {
    this.logger.info(JSON.stringify(message), ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): any {
    this.logger.warn(JSON.stringify(message), ...optionalParams);
  }
}
