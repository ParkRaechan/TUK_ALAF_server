const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 토큰 생성 함수
const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// 1. 회원가입 (비밀번호 암호화 저장)
exports.register = async (req, res) => {
    const { name, email, password, phone_number, role } = req.body;
    
    // DB 연결
    const conn = await pool.getConnection();
    try {
        // 이메일 중복 체크
        const [existing] = await conn.query('SELECT * FROM Member WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
        }

        // 비밀번호 암호화 (해싱)
        const hashedPassword = await bcrypt.hash(password, 12);

        // DB 저장
        const [result] = await conn.query(
            `INSERT INTO Member (name, email, password, phone_number, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, phone_number, role || 'USER']
        );

        // 토큰 발급
        const token = signToken(result.insertId, role || 'USER');

        res.status(201).json({
            message: '회원가입 성공',
            token,
            user: { id: result.insertId, name, email, role: role || 'USER' }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 에러' });
    } finally {
        conn.release();
    }
};

// 2. 로그인 (토큰 발급)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    const conn = await pool.getConnection();
    try {
        // 유저 확인
        const [users] = await conn.query('SELECT * FROM Member WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: '이메일 혹은 비밀번호가 틀렸습니다.' });
        }

        const user = users[0];

        // 비밀번호 확인 (입력값 vs DB해시값 비교)
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: '이메일 혹은 비밀번호가 틀렸습니다.' });
        }

        // 로그인 성공 -> 토큰 발급
        const token = signToken(user.member_id, user.role);

        res.status(200).json({
            message: '로그인 성공',
            token,
            user: { 
                id: user.member_id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                point: user.point 
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 에러' });
    } finally {
        conn.release();
    }
};