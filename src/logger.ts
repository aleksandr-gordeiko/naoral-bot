import pino from 'pino';

let loggerVar;
if (process.env.DEBUG) {
  loggerVar = pino({
    transport: {
      target: 'pino-pretty',
    },
  });
} else {
  loggerVar = pino(pino.destination({
    dest: './log/production.log',
    mkdir: true,
  }));
}

const logger = loggerVar;

export default logger;
