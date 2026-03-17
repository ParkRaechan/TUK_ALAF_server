const nodemailer = require('nodemailer');
const pool = require('../config/db');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 구글 이메일 전송 설정
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // .env에서 가져옴
        pass: process.env.EMAIL_PASS  // 마찬가지로
    }
});

// 새 분실물 등록 시 알림 이메일 발송
exports.sendNotificationEmails = async (itemId, itemName, categoryId, placeName) => {
    const conn = await pool.getConnection();
    try {
        // 해당 카테고리를 구독 중인 유저 조회
        const [users] = await conn.query(`
            SELECT DISTINCT m.email 
            FROM Notification n
            JOIN Member m ON n.member_id = m.member_id
            JOIN Category c ON c.major_category_id = n.major_category_id
            WHERE c.category_id = ? AND n.is_active = TRUE
        `, [categoryId]);

        if (users.length === 0) {
            console.log(`[알림] 카테고리 ID ${categoryId}를 구독 중인 유저가 없습니다.`);
            return;
        }

        const emailList = users.map(u => u.email);

        const mailOptions = {
            from: `"분실물 알리미" <${process.env.EMAIL_USER}>`,
            bcc: emailList, // 단체 메일 숨은 참조
            subject: `[알림] 새로운 분실물(${itemName})이 등록되었습니다!`,
            html: `
                <div style="padding: 20px; font-family: sans-serif; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #343a40;">새로운 분실물이 등록되었습니다 🔔</h2>
                    <p>회원님이 알림을 신청하신 카테고리의 새로운 물품이 들어왔습니다.</p>
                    <ul style="background: #f8f9fa; padding: 15px 30px; border-radius: 8px;">
                        <li><strong>물품명:</strong> ${itemName}</li>
                        <li><strong>습득 장소:</strong> ${placeName || '장소 미상'}</li>
                    </ul>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL}/detail/${itemId}" 
                           style="background: #2b8a3e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                           분실물 확인하러 가기
                        </a>
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[알림] ${emailList.length}명에게 이메일 발송 성공!`);

    } catch (err) {
        console.error('메일 발송 중 에러 발생:', err);
    } finally {
        conn.release();
    }
};