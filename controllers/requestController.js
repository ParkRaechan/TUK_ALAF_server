const pool = require('../config/db');

// 4. 회수 신청 (사용자 -> 관리자 제출용)
exports.createRequest = async (req, res) => {
    const { item_id, proof_description, proof_detail_address } = req.body;
    const requester_id = req.user.id; // authMiddleware에서 옴
    const proofImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        // 이미 신청된 물건인지 확인
        const [check] = await pool.query(`SELECT * FROM RetrievalRequest WHERE item_id = ? AND status IN ('PENDING', 'APPROVED')`, [item_id]);
        if (check.length > 0) return res.status(400).json({ message: '이미 신청 진행 중인 물건입니다.' });

        // 신청서 저장
        await pool.query(
            `INSERT INTO RetrievalRequest (item_id, requester_id, proof_description, proof_detail_address, proof_image_url, status)
             VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [item_id, requester_id, proof_description, proof_detail_address, proofImageUrl]
        );

        // 분실물 상태 변경 (다른 사람이 못 보게)
        await pool.query(`UPDATE Item SET status = '회수신청중' WHERE item_id = ?`, [item_id]);

        res.status(201).json({ message: '회수 신청 완료. 관리자 승인을 기다리세요.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// 5. 관리자 - 신청 내역 조회 (비교용)
exports.getAdminRequests = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, m.name AS requester_name, i.name AS item_name, i.image_url AS original_image, i.description AS original_desc
             FROM RetrievalRequest r
             JOIN Member m ON r.requester_id = m.member_id
             JOIN Item i ON r.item_id = i.item_id
             WHERE r.status = 'PENDING'`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. 관리자 - 승인 또는 거절
exports.processRequest = async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body; // 'APPROVE' (승인)

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        if (action === 'APPROVE') {
            // 1. 상태만 '승인'으로 변경 (물리적 행동 X)
            await conn.query(`UPDATE RetrievalRequest SET status = 'APPROVED' WHERE request_id = ?`, [requestId]);
            
            // 승인됨을 알리기 위해 Item 상태도 변경하기
            // await conn.query(`UPDATE Item SET status = '회수대기' WHERE ...`);
        } else {
            // 거절 로직
            const [reqData] = await conn.query(`SELECT item_id FROM RetrievalRequest WHERE request_id = ?`, [requestId]);
            await conn.query(`UPDATE RetrievalRequest SET status = 'REJECTED' WHERE request_id = ?`, [requestId]);
            await conn.query(`UPDATE Item SET status = '보관중' WHERE item_id = ?`, [reqData[0].item_id]);
        }

        await conn.commit();
        res.json({ message: `신청이 ${action} 처리되었습니다.` });

    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
};