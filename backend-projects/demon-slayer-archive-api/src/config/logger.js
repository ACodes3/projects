
import winston from "winston";

// ==========================================
// LOGGER CONFIGURATION
// ==========================================

const environment = process.env.NODE_ENV || "development";

const isProduction = environment === "production";
const isTest = environment === "test";

// ==========================================
// LOG FORMATS
// ==========================================

// Human-readable development logs
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(
    ({ timestamp, level, message, stack, ...metadata }) => {
      const details = Object.keys(metadata).length
        ? ` ${JSON.stringify(metadata)}`
        : "";

      return `${timestamp} ${level}: ${stack || message}${details}`;
    }
  )
);

// Structured JSON logs for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ==========================================
// CREATE LOGGER
// ==========================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",

  format: isProduction
    ? productionFormat
    : developmentFormat,

  transports: [
    new winston.transports.Console({
      // Keep automated test output clean.
      silent: isTest,
    }),
  ],
});

export default logger;
