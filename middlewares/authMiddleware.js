const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// 1. 토큰 인증 미들웨어 (Real Mode)
exports.authenticateToken = async (req, res, next) => {
    // 헤더에서 토큰 추출: "Bearer eyJhbGci..."
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '로그인이 필요합니다. (토큰 없음)' });
    }

    try {
        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // (선택) DB에 유저가 실제로 존재하는지 한 번 더 확인하면 더 안전함
        // const [users] = await pool.query('SELECT * FROM Member WHERE member_id = ?', [decoded.id]);
        // if (users.length === 0) throw new Error();

        // req.user에 유저 정보 저장 (컨트롤러에서 사용 가능)
        req.user = { 
            id: decoded.id, 
            role: decoded.role 
        };
        
        next(); // 통과
    } catch (err) {
        console.error('JWT 인증 실패:', err.message);
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

// 2. 관리자 권한 확인
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
};