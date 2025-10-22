import pino from 'pino';
import { ENV } from '@seamless/config';

export const logger = pino({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    ENV.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
