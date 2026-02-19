const pool = require('../config/db'); 

// 1. 키오스크 - 내 회수 신청 목록 조회 (수령 가능한 '회수승인' 상태만)
exports.getMyApprovedRequests = async (req, res) => {
    // authMiddleware를 통과했으므로 req.user.id 에 로그인한 유저 정보가 있습니다.
    const requester_id = req.user.id; 

    try {
        // [핵심] 내가 신청한 것 중, 관리자가 'APPROVED' 했고, 아이템 상태가 '회수승인'인 것만 가져옵니다.
        const [rows] = await pool.query(
            `SELECT 
                r.request_id, r.requested_at, r.status AS req_status,
                i.item_id, i.name AS item_name, i.image_url, i.locker_number, i.status AS item_status
             FROM RetrievalRequest r
             JOIN Item i ON r.item_id = i.item_id
             WHERE r.requester_id = ? 
               AND r.status = 'APPROVED' 
               AND i.status = '회수승인'
             ORDER BY r.requested_at DESC`,
            [requester_id]
        );

        res.json(rows);
    } catch (err) {
        console.error('키오스크 목록 조회 에러:', err);
        res.status(500).json({ error: '목록을 불러오는 중 서버 에러가 발생했습니다.' });
    }
};

// 2. 키오스크 - 수령 완료 처리 (프론트에서 작업 끝내면 호출)
exports.completeRetrieval = async (req, res) => {
    // URL 파라미터로 request_id를 받는다고 가정합니다.
    const { requestId } = req.params; 
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction(); // 트랜잭션 시작

        // 1. 요청 내역의 item_id 가져오기
        const [reqData] = await conn.query(
            `SELECT item_id FROM RetrievalRequest WHERE request_id = ? AND status = 'APPROVED'`, 
            [requestId]
        );

        if (reqData.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: '유효하지 않거나 이미 처리된 요청입니다.' });
        }

        const itemId = reqData[0].item_id;

        // 2. RetrievalRequest(신청 내역) 상태 업데이트 -> 'COMPLETED' (수령완료)
        await conn.query(
            `UPDATE RetrievalRequest SET status = 'COMPLETED' WHERE request_id = ?`, 
            [requestId]
        );

        // 3. Item(분실물) 상태 업데이트 -> '회수완료' 및 잠금 해제
        // (잠금 해제는 굳이 안 해도 되지만, DB 정리를 위해 NULL 처리)
        await conn.query(
            `UPDATE Item SET status = '회수완료', locked_until = NULL WHERE item_id = ?`, 
            [itemId]
        );

        await conn.commit(); // 트랜잭션 성공
        res.json({ message: '회수 처리가 완료되었습니다. 보관함 문이 닫힌 것을 확인해주세요.' });

    } catch (err) {
        await conn.rollback(); // 에러 시 되돌리기
        console.error('키오스크 수령 완료 에러:', err);
        res.status(500).json({ error: '수령 완료 처리 중 서버 에러가 발생했습니다.' });
    } finally {
        conn.release();
    }
};