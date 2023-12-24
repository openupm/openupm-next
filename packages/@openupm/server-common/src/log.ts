import bunyan from 'bunyan';

// Create logger for given module
function createLogger(name: string): bunyan {
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
          level: process.env.OPENUPM_DEBUG ? 'debug' : 'info',
          stream: process.stdout,
        },
        { level: 'error', stream: process.stderr },
      ],
    });
  }
}

export default createLogger;
