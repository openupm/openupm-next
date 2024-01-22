import bunyan from 'bunyan';
import config from 'config';

// Create logger for given module
export function createLogger(name: string): bunyan {
  let logLevel: string = config.logLevel || 'info';
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
