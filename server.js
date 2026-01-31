const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

/*
// 소켓 설정 (키오스크 제어용) (후에 기능 추가용)
const io = new Server(server, { cors: { origin: "*" } });
app.set('io', io); // 라우터에서 io를 쓸 수 있게 등록
*/

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 이미지

// 라우터 연결
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

/*
// 소켓 연결 이벤트 (키오스크가 켜질 때) (후에 기능 추가용)
io.on('connection', (socket) => {
    console.log('소켓 연결됨:', socket.id);
    
    // 키오스크가 "나 1번 기기요" 하고 등록
    socket.on('register_kiosk', (kioskId) => {
        socket.join(`kiosk_${kioskId}`);
        console.log(`키오스크 ${kioskId}번 등록 완료`);
    });
});
*/

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});