//====================================================================================================================
//====================================================================================================================
// src/middlewares/logging.middleware.js
// 로깅 미들웨어 : winston 사용
//====================================================================================================================
//====================================================================================================================
import winston from 'winston';
import path from 'path'
import winstonDailyFile from 'winston-daily-rotate-file';

// 로그 파일 저장 위치
const logDirectory = 'logs';

const logger = winston.createLogger({
    level:                                                                  // log level: info
        'info',                                
    format:                                                                 // log format: json, timestamp
        winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json(),
        ),
    transports: [                                                           // log: console, file
        new winston.transports.Console(),
        new winstonDailyFile({ 
            filename: path.join(logDirectory, '%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ],
});

export default function (req, res, next) {
    // client request 사건 기록
    const start = new Date().getTime();

    // response 완료 시 기록
    res.on('finish', () => {
        const duration = new Date().getTime() - start;
        logger.info(
            `Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`,
        );
    });

    // response에서 error 시 기록
    res.on('error', (error) => {
        logger.error({
            message: '[Error] error occurred',
            error: error.message,
            stack: error.stack,
        });
    });

    next();
}