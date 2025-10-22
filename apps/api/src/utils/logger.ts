import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.server.nodeEnv === 'production' ? 'info' : 'debug',
  transport: config.server.nodeEnv !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}