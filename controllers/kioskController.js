const pool = require('../config/db');

// 7. 내 회수 가능 목록 보기 (키오스크 로그인 시)
exports.getMyRetrievableItems = async (req, res) => {
    const userId = req.user.id;

    try {
        // 승인(APPROVED)되었고 아직 수거안한(is_retrieved=0) 물건 조회
        const [rows] = await pool.query(
            `SELECT i.item_id, i.name, i.image_url, i.locker_number, r.request_id
             FROM RetrievalRequest r
             JOIN Item i ON r.item_id = i.item_id
             WHERE r.requester_id = ? AND r.status = 'APPROVED' AND i.is_retrieved = FALSE`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. 물건 회수 실행 (박스 오픈)
exports.retrieveItem = async (req, res) => {
    const { item_id } = req.body;
    const userId = req.user.id;   // 로그인한 사용자 ID

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. 유효성 체크: "내 물건이고, 승인(APPROVED) 상태인가?"
        const [check] = await conn.query(
            `SELECT i.locker_number 
             FROM RetrievalRequest r
             JOIN Item i ON r.item_id = i.item_id
             WHERE r.requester_id = ? AND r.item_id = ? 
               AND r.status = 'APPROVED' 
               AND i.is_retrieved = FALSE`,
            [userId, item_id]
        );

        if (check.length === 0) {
            return res.status(400).json({ message: '회수 권한이 없거나 이미 수령했습니다.' });
        }

        const lockerNum = check[0].locker_number;

        // 2. DB 업데이트: 수령 완료 처리
        await conn.query(`UPDATE Item SET is_retrieved = TRUE, status = '반환완료' WHERE item_id = ?`, [item_id]);
        await conn.query(`UPDATE RetrievalRequest SET status = 'COLLECTED' WHERE item_id = ?`, [item_id]);

        await conn.commit();

        // 3. [중요] HTTP 응답으로 박스 번호를 바로 준다.
        // 키오스크는 이 응답(true)을 받으면 문을 열면 된다.
        res.json({ 
            success: true, 
            lockerNumber: lockerNum,
            message: `${lockerNum}번 보관함이 열립니다.` 
        });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: '서버 에러' });
    } finally {
        conn.release();
    }
};