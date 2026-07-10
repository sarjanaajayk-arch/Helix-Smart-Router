type LogLevel = "INFO" | "WARN" | "ERROR";

const log = (level: LogLevel, message: string) => {
  const time = new Date().toISOString();
  console.log(`[${time}] [${level}] ${message}`);
};

export const logger = {
  info: (message: string) => log("INFO", message),
  warn: (message: string) => log("WARN", message),
  error: (message: string) => log("ERROR", message),
};