import winston from 'winston';

const fmt = winston.format;

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fmt.combine(
    fmt.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    fmt.errors({ stack: true }),
    fmt.colorize(),
    fmt.printf(({ timestamp, level, message, stack }) =>
      stack
        ? `${timestamp} [${level}]: ${message}\n${stack}`
        : `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});
