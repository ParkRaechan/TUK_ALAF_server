const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// 인증번호 임시 저장소
const verificationCodes = new Map();

const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
};

// 1. 이메일 인증번호 발송 API
exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body; 

    if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS 
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '[TUK ALAF] 회원가입 이메일 인증번호입니다.',
        text: `회원가입 인증번호는 [ ${code} ] 입니다. 3분 안에 입력해주세요.`
    };

    try {
        await transporter.sendMail(mailOptions);
        
        verificationCodes.set(email, {
            code,
            expiresAt: Date.now() + 3 * 60 * 1000 
        });

        res.status(200).json({ message: '인증번호가 발송되었습니다.' });
    } catch (error) {
        console.error('이메일 발송 에러:', error);
        res.status(500).json({ error: '이메일 발송에 실패했습니다.' });
    }
};

// 2. 이메일 인증번호 확인 API
exports.verifyCode = (req, res) => {
    const { email, code } = req.body;
    const record = verificationCodes.get(email);

    if (!record) return res.status(400).json({ message: '인증번호 발송 기록이 없습니다.' });
    if (Date.now() > record.expiresAt) {
        verificationCodes.delete(email);
        return res.status(400).json({ message: '인증번호가 만료되었습니다. 다시 요청해주세요.' });
    }
    if (record.code !== code) return res.status(400).json({ message: '인증번호가 일치하지 않습니다.' });

    verificationCodes.delete(email);
    res.status(200).json({ message: '이메일 인증이 완료되었습니다.' });
};

// 3. 회원가입 (수정된 SQL 스키마 반영)
exports.register = async (req, res) => {
    // 스키마에 존재하는 필드만 받기
    const { email, password, name, phone_number, role } = req.body;
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // [체크] 이메일 중복 확인
        const [existing] = await conn.query('SELECT * FROM Member WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: '이미 가입된 이메일입니다.' });
        }

        // [보안] 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 12);

        // [저장] DB 데이터 삽입 (point, has_retrieval_permission은 DEFAULT 값이 들어가므로 생략)
        const [result] = await conn.query(
            `INSERT INTO Member (name, email, password, phone_number, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, phone_number, role || 'USER']
        );

        const newMemberId = result.insertId;
        const token = signToken(newMemberId, role || 'USER');

        await conn.commit();

        res.status(201).json({
            message: '회원가입 성공',
            token,
            user: { id: newMemberId, email, name, role: role || 'USER' }
        });

    } catch (err) {
        await conn.rollback();
        console.error("Signup Error:", err);
        res.status(500).json({ error: '회원가입 처리 중 서버 에러가 발생했습니다.' });
    } finally {
        conn.release();
    }
};

// 4. 로그인 (login_id -> email 로 변경)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });

    const conn = await pool.getConnection();
    try {
        const [users] = await conn.query('SELECT * FROM Member WHERE email = ?', [email]);
        
        if (users.length === 0) return res.status(401).json({ message: '이메일 혹은 비밀번호가 틀렸습니다.' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) return res.status(401).json({ message: '이메일 혹은 비밀번호가 틀렸습니다.' });

        const token = signToken(user.member_id, user.role);

        res.status(200).json({
            message: '로그인 성공',
            token,
            user: { 
                id: user.member_id, 
                email: user.email,
                name: user.name, 
                role: user.role,
                point: user.point 
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: '로그인 중 서버 에러가 발생했습니다.' });
    } finally {
        conn.release();
    }
};