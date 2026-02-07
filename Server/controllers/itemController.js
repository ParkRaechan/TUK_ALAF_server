const pool = require('../config/db');

// 1. 분실물 등록 (키오스크/관리자)
exports.registerItem = async (req, res) => {
    // 이미지 파일 경로 처리
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // 요청 바디 데이터
    const { name, category_id, place_id, description, found_date } = req.body;

    // [수정됨] 로그인한 상태(토큰 있음)라면 req.user.id를 사용, 아니면 null (익명 습득)
    const finder_id = req.user ? req.user.id : null;

    // [수정됨] 보관함 번호 기본값 설정 (요청에 없으면 1번)
    const locker_number = req.body.locker_number || 1;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. 분실물 DB 저장
        const [result] = await conn.query(
            `INSERT INTO Item 
            (name, category_id, place_id, description, found_date, finder_id, image_url, locker_number, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, '보관중')`,
            [name, category_id, place_id, description, found_date, finder_id, imageUrl, locker_number]
        );

        // 2. 로그인한 회원이 등록했을 경우 포인트 지급 (트랜잭션 묶음)
        if (finder_id) {
            await conn.query(
                `UPDATE Member SET point = point + 100 WHERE member_id = ?`, 
                [finder_id]
            );
        }

        await conn.commit();
        res.status(201).json({ message: '분실물 등록 완료', itemId: result.insertId });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: '등록 실패' });
    } finally {
        conn.release();
    }
};

// 2. 분실물 목록 조회 (보관중인 물건만)
exports.getItems = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT item_id, name, image_url, created_at, status, locked_until
             FROM Item 
             WHERE status = '보관중' OR status = '회수신청중' 
             ORDER BY created_at DESC`
        );
        // 잠금 상태 및 신청 가능 여부 계산
        const now = new Date();
        const processedRows = rows.map(item => {
            // 잠금 시간이 존재하고, 현재 시간보다 미래라면 잠긴 상태
            const isLocked = item.locked_until && new Date(item.locked_until) > now;
            
            // 신청 가능 조건: 상태가 '보관중'이거나, 잠금 시간이 지났을 때
            // (즉, 회수신청중이어도 48시간 지났으면 다시 신청 가능하므로)
            const isAvailable = (item.status === '보관중') || (!isLocked && item.status === '회수신청중');

            return {
                ...item,
                is_available: isAvailable, // true or false
                display_status: isAvailable ? '보관중' : '회수신청중' // 프론트 표시용 텍스트
            };
        });
        res.json(processedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. 분실물 상세 조회
exports.getItemDetail = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [rows] = await pool.query(
            `SELECT i.*, c.name AS category_name, p.address, p.detail_address 
             FROM Item i
             JOIN Category c ON i.category_id = c.category_id
             JOIN Place p ON i.place_id = p.place_id
             WHERE i.item_id = ?`, 
            [id]
        );
        
        if (rows.length === 0) return res.status(404).json({ message: '물건 없음' });
        const item = rows[0];
        const now = new Date();
        // 잠금 여부 계산
        const isLocked = item.locked_until && new Date(item.locked_until) > now;
        // 신청 가능 여부 판단
        // 상태가 '보관중'이면 무조건 가능
        // 상태가 '회수신청중'이어도 시간이 지났으면(isLocked === false) 가능
        let isAvailable = true;
        let lockMessage = null;

        if (item.status === '회수승인' || item.status === '회수완료') {
            isAvailable = false;
            lockMessage = "이미 주인이 찾아간 물건입니다.";
        } else if (isLocked) {
            isAvailable = false;
            // 남은 시간 계산 (선택사항)
            const diffHours = Math.ceil((new Date(item.locked_until) - now) / (1000 * 60 * 60));
            lockMessage = `다른 사용자가 회수 신청 중입니다. (잠금 해제까지 약 ${diffHours}시간 남음)`;
        }

        res.json({
            ...item,
            is_available: isAvailable,  // 프론트: 이 값이 false면 버튼 비활성화 (disabled)
            lock_message: lockMessage   // 프론트: 버튼 밑에 띄울 경고 문구
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};