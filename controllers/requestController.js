const pool = require('../config/db');

// 4. 회수 신청 (사용자 -> 관리자 제출용) + 48시간 잠금 로직 적용
exports.createRequest = async (req, res) => {
    const { item_id, proof_description, proof_detail_address } = req.body;
    const requester_id = req.user.id; // authMiddleware에서 옴
    const proofImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const conn = await pool.getConnection();
    try {
        // [트랜잭션 시작]
        await conn.beginTransaction();

        // 1. 해당 아이템의 현재 잠금 상태 확인 (FOR UPDATE로 동시 수정 방지)
        const [items] = await conn.query(
            `SELECT locked_until, status FROM Item WHERE item_id = ? FOR UPDATE`, 
            [item_id]
        );

        if (items.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: '해당 물건이 존재하지 않습니다.' });
        }

        const item = items[0];
        const now = new Date();

        // [핵심] 이미 누군가 신청해서 잠겨있는지(쿨타임) 확인
        if (item.locked_until && new Date(item.locked_until) > now) {
            await conn.rollback();
            return res.status(409).json({ // 409 Conflict
                message: '이미 다른 사용자가 회수 신청 중인 물건입니다. (48시간 잠금)',
                locked_until: item.locked_until
            });
        }

        // 2. 신청서 저장 (RetrievalRequest)
        await conn.query(
            `INSERT INTO RetrievalRequest 
             (item_id, requester_id, proof_description, proof_detail_address, proof_image_url, status)
             VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [item_id, requester_id, proof_description, proof_detail_address, proofImageUrl]
        );

        // 3. 분실물 상태 변경 및 잠금 시간 설정 (현재시간 + 48시간)
        await conn.query(
            `UPDATE Item 
             SET locked_until = DATE_ADD(NOW(), INTERVAL 48 HOUR), 
                 status = 'pending' 
             WHERE item_id = ?`,
            [item_id]
        );

        await conn.commit();
        res.status(201).json({ message: '회수 신청 완료. 관리자 승인을 기다리세요 (48시간 동안 선점됨).' });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: '서버 에러 발생' });
    } finally {
        conn.release();
    }
};

// 5. 관리자 - 신청 내역 조회
exports.getAdminRequests = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, m.name AS requester_name, m.email, i.name AS item_name, i.image_url AS original_image
             FROM RetrievalRequest r
             JOIN Member m ON r.requester_id = m.member_id
             JOIN Item i ON r.item_id = i.item_id
             WHERE r.status = 'PENDING'
             ORDER BY r.requested_at ASC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. 관리자 - 승인 또는 거절 처리
exports.processRequest = async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 요청 정보 가져오기
        const [reqData] = await conn.query(`SELECT item_id FROM RetrievalRequest WHERE request_id = ?`, [requestId]);
        if (reqData.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: '신청 내역 없음' });
        }
        const itemId = reqData[0].item_id;

        if (action === 'APPROVE') {
            // [승인 시]
            // 1. 요청 상태 -> APPROVED
            await conn.query(`UPDATE RetrievalRequest SET status = 'APPROVED' WHERE request_id = ?`, [requestId]);
            
            // 2. 아이템 상태 -> 회수승인 (이제 키오스크에서 문 열기 가능해짐)
            // *주의: 승인되어도 locked_until은 유지하거나, 아예 수령 전까지 냅둬도 무방함.
            await conn.query(`UPDATE Item SET status = '회수승인' WHERE item_id = ?`, [itemId]);

        } else if (action === 'REJECT') {
            // [거절 시]
            // 1. 요청 상태 -> REJECTED
            await conn.query(`UPDATE RetrievalRequest SET status = 'REJECTED' WHERE request_id = ?`, [requestId]);
            
            // 2. 아이템 상태 -> 보관중 (원상복구)
            // 3. [중요] 잠금 해제 (locked_until = NULL) -> 그래야 다른 사람이 다시 신청 가능!
            await conn.query(`UPDATE Item SET status = '보관중', locked_until = NULL WHERE item_id = ?`, [itemId]);
        }

        await conn.commit();
        res.json({ message: `신청이 ${action} 처리되었습니다.` });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
};