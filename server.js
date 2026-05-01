const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 소켓 설정 (채팅 및 알림용)
const io = new Server(server, { 
    cors: { origin: "*", methods: ["GET", "POST"] } 
});
app.set('io', io); // 컨트롤러에서 io 객체를 사용할 수 있게 설정

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 이미지

// 라우터 연결
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// 소켓 연결 이벤트 (채팅 기능)
io.on('connection', (socket) => {
    console.log('클라이언트 소켓 연결됨:', socket.id);
    
    // 특정 채팅방(room_id)에 입장
    socket.on('join_room', (roomId) => {
        socket.join(`room_${roomId}`);
        console.log(`User joined room: ${roomId}`);
    });

    // 메시지 전송 이벤트 받기
    socket.on('send_message', (data) => {
        io.to(`room_${data.roomId}`).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('클라이언트 연결 해제:', socket.id);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});