import {createLogger, format, transports} from "winston";

const logFormat = format.printf(({level, message, label, timestamp, ...meta}) => {
  return `${timestamp} ${label ? `[${label}] ` : ''}${level}: ${message}${Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''}`;
});

/**
 * The default logger.
 */
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  },
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format(info => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    format.errors({stack: true}),
    format.splat(),
    format.colorize({colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
        trace: 'gray'
    }}),
    logFormat
  ),
  transports: [
    // TODO Make transport configurable
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),

    // causes high memory usage. do not use in production
    // new transports.Console()
  ]
});
