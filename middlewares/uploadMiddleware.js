const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. uploads 폴더가 없으면 자동으로 생성하는 안전장치
try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 새로 생성합니다.');
    fs.mkdirSync('uploads');
}

// 2. 저장소 설정
const storage = multer.diskStorage({
    // 저장할 경로
    destination(req, file, done) {
        done(null, 'uploads/');
    },
    // 저장할 파일 이름 (중복 방지를 위해 날짜값 붙임)
    filename(req, file, done) {
        const ext = path.extname(file.originalname); // 확장자 추출 (.png)
        const basename = path.basename(file.originalname, ext); // 파일명 추출
        done(null, basename + '_' + Date.now() + ext); // 예: image_170321123.png
    }
});

// 3. 미들웨어 생성 (파일 크기 제한 5MB)
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

module.exports = upload;