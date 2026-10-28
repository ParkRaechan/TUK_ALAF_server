const winston = require('winston');
const path = require('path');
const fs = require('fs');

// logs 폴더가 없으면 자동 생성
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    // 모든 로그를 combined.log에 저장
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    // error 레벨 로그만 error.log에 별도 저장
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
});

// 개발 환경 및 로컬 테스트 시 콘솔에도 로그 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;