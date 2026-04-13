import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

const commonOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"],
};

// Pretty logs are only enabled in local development.
// Serverless environments should always write plain JSON to stdout.
export const logger = isDevelopment
  ? pino({
      ...commonOptions,
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    })
  : pino(commonOptions);
