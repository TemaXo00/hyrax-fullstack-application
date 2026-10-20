import { ConsoleLoggerOptions } from '@nestjs/common'

export const CONSOLE_LOGGER_CONFIG = (name: string): ConsoleLoggerOptions => {
  return {
    prefix: name.toUpperCase(),
    colors: true,
    compact: true,
    timestamp: false,
  }
}
