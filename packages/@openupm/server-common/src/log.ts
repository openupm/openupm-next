import bunyan from 'bunyan';
import configRaw from 'config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

// Create logger for given module
export function createLogger(name: string): bunyan {
  let logLevel: string =
    process.env.OPENUPM_LOG_LEVEL || config.logLevel || 'info';
  if (process.env.OPENUPM_DEBUG) {
    logLevel = 'debug';
  }
  if (process.env.NODE_ENV === 'test') {
    return bunyan.createLogger({
      name,
      serializers: bunyan.stdSerializers,
      streams: [{ level: 'fatal', stream: process.stdout }],
    });
  } else {
    return bunyan.createLogger({
      name,
      serializers: bunyan.stdSerializers,
      streams: [
        {
          level: logLevel,
          stream: process.stdout,
        },
        { level: 'error', stream: process.stderr },
      ],
    });
  }
}
