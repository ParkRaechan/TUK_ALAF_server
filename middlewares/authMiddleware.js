const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// 1. 토큰 인증 미들웨어
exports.authenticateToken = async (req, res, next) => {
    // 헤더에서 토큰 추출
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '로그인이 필요합니다. (토큰 없음)' });
    }

    try {
        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // [중요] DB에서 유저 존재 여부 및 최신 정보 확인
        // SQL에서 member_id로 정의했으므로 이를 조회합니다.
        const [users] = await pool.query(
            'SELECT member_id, role, name FROM Member WHERE member_id = ?', 
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(403).json({ message: '존재하지 않는 사용자입니다.' });
        }

        // req.user에 DB의 최신 정보를 담아 컨트롤러로 넘김
        req.user = { 
            id: users[0].member_id, 
            role: users[0].role,
            name: users[0].name
        };
        
        next(); 
    } catch (err) {
        console.error('JWT 인증 실패:', err.message);
        // 토큰 만료 시 401을 주어 프론트에서 로그아웃 처리를 유도하는 것이 좋습니다.
        return res.status(401).json({ message: '토큰이 만료되었거나 유효하지 않습니다.' });
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