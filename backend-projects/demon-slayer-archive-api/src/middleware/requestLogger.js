
import morgan from "morgan";
import logger from "../config/logger.js";

// ==========================================
// HTTP REQUEST LOGGING
// ==========================================

const requestLogger = morgan(
  ":method :url :status :response-time ms",
  {
    stream: {
      write(message) {
        logger.info(message.trim());
      },
    },
    skip(req) {
      return process.env.NODE_ENV === "test";
    },
  }
);

export default requestLogger;
