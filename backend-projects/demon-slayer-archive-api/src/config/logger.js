
import winston from "winston";

// ==========================================
// LOGGER CONFIGURATION
// ==========================================

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",

  // Add timestamps and error stack traces.
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
              format: "HH:mm:ss",
            }),
            winston.format.printf(
              ({ timestamp, level, message, stack }) =>
                `${timestamp} ${level}: ${stack || message}`
            )
          ),
    }),
  ],
});

export default logger;
