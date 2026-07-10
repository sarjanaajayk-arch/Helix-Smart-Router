import winston from "winston";

const { combine, timestamp, errors, printf } = winston.format;

export enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    DEBUG = "debug",
}

const jsonFormatter = printf((info) => {
    const log = {
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        ...(info.context ?? {}),
        ...(info.stack ? { stack: info.stack } : {}),
    };

    return JSON.stringify(log);
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || LogLevel.INFO,

    format: combine(
        timestamp(),
        errors({ stack: true }),
        jsonFormatter
    ),

    defaultMeta: {
        service: "helix",
    },

    transports: [
        new winston.transports.Console(),
    ],
});

export interface LogContext {
    requestId?: string;

    provider?: string;

    model?: string;

    latency?: number;

    duration?: number;

    statusCode?: number;

    method?: string;

    path?: string;

    retryAttempt?: number;

    retryDelay?: number;

    failoverFrom?: string;

    failoverTo?: string;

    stream?: boolean;

    [key: string]: unknown;
}

export class HelixLogger {
    info(message: string, context?: LogContext) {
        logger.info(message, { context });
    }

    warn(message: string, context?: LogContext) {
        logger.warn(message, { context });
    }

    error(message: string, error?: unknown, context?: LogContext) {
        if (error instanceof Error) {
            logger.error(error.message, {
                stack: error.stack,
                context: {
                    ...context,
                    originalMessage: message,
                },
            });
            return;
        }

        logger.error(message, {
            context: {
                ...context,
                error,
            },
        });
    }

    debug(message: string, context?: LogContext) {
        logger.debug(message, { context });
    }

    http(message: string, context?: LogContext) {
        logger.http(message, { context });
    }
}

export const helixLogger = new HelixLogger();