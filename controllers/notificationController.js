const pool = require('../config/db');

// 1. 유저의 현재 알림 설정(대분류 이름들) 불러오기
exports.getUserAlerts = async (req, res) => {
    // 토큰에서 유저 ID 추출
    const memberId = req.user.id || req.user.member_id; 
    const conn = await pool.getConnection();
    
    try {
        const [rows] = await conn.query(`
            SELECT m.name 
            FROM Notification n
            JOIN MajorCategory m ON n.major_category_id = m.major_category_id
            WHERE n.member_id = ?
        `, [memberId]);
        
        const categories = rows.map(row => row.name);
        res.status(200).json({ alerts: categories });
    } catch (err) {
        console.error('알림 조회 에러:', err);
        res.status(500).json({ error: '알림 목록을 불러오지 못했습니다.' });
    } finally {
        conn.release();
    }
};

// 2. 유저의 알림 설정 업데이트
exports.updateUserAlerts = async (req, res) => {
    const memberId = req.user.id || req.user.member_id;
    const { categories } = req.body; 
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        // 기존 알림 설정 깔끔하게 싹 지우기
        await conn.query(`DELETE FROM Notification WHERE member_id = ?`, [memberId]);

        // 체크한 카테고리가 있다면 새로 Insert
        if (categories && categories.length > 0) {
            // 넘어온 글자('가방')들을 DB에 있는 major_category_id(1)로 변환하기 위해 검색
            const [majorRows] = await conn.query(
                `SELECT major_category_id, name FROM MajorCategory WHERE name IN (?)`, 
                [categories]
            );

            // Insert를 위한 배열 데이터 생성
            const values = majorRows.map(row => [memberId, row.major_category_id]);
            
            if (values.length > 0) {
                await conn.query(
                    `INSERT INTO Notification (member_id, major_category_id) VALUES ?`, 
                    [values]
                );
            }
        }

        await conn.commit();
        res.status(200).json({ message: '알림 설정이 성공적으로 저장되었습니다.' });
    } catch (err) {
        await conn.rollback();
        console.error('알림 저장 에러:', err);
        res.status(500).json({ error: '알림 설정 저장에 실패했습니다.' });
    } finally {
        conn.release();
    }
};