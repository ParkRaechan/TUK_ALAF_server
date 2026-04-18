const pool = require('../config/db');
const redisClient = require('../config/redis');
const { sendNotificationEmails } = require('../utils/mailer'); // 메일러 불러오기

// 1. 분실물 등록 (키오스크/관리자)
exports.registerItem = async (req, res) => {
    // 이미지 파일 경로 처리
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // 요청 바디 데이터
    const { name, category_id, place_id, detail_address, description, found_date } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // 로그인한 상태(토큰 있음)라면 req.user.id를 사용, 아니면 null (익명 습득)
    const finder_id = req.user ? req.user.id : null;

    // 보관함 번호 기본값 설정 (요청에 없으면 1번)
    const locker_number = req.body.locker_number || 1;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 분실물 DB 저장
        const [result] = await conn.query(
            `INSERT INTO Item 
            (name, category_id, place_id, detail_address, description, found_date, finder_id, image_url, locker_number, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '보관중')`,
            [name, category_id, place_id, detail_address, description, found_date, finder_id, imageUrl, locker_number]
        );
        
        // 분실물 정보 저장 -> 후속 이메일 연동
        newItemId = result.insertId;
        
        // 로그인한 회원이 등록했을 경우 포인트 지급 (트랜잭션 묶음)
        if (finder_id) {
            await conn.query(
                `UPDATE Member SET point = point + 100 WHERE member_id = ?`, 
                [finder_id]
            );
        }

        await conn.commit();
        res.status(201).json({ message: '분실물 등록 완료', itemId: result.insertId });
        
        // 캐시 무효화: 새 아이템 등록 시 목록 캐시 삭제
        try {
            const cacheKeys = await redisClient.KEYS('items:*');
            if (cacheKeys.length > 0) {
                await redisClient.DEL(cacheKeys);
            }
        } catch (cacheErr) {
            console.error('캐시 무효화 에러:', cacheErr);
        }
        
        // 이메일 발송 (응답 후 백그라운드에서 실행)
        try {
            // 장소 이름을 가져오기 위한 쿼리
            const [[placeRow]] = await pool.query(
                `SELECT address FROM Place WHERE place_id = ?`, 
                [place_id]
            );
            const placeName = placeRow ? placeRow.address : '교내 어딘가';

            // 메일 발송 함수 호출 (await를 쓰지 않아서 응답 지연을 막음)
            sendNotificationEmails(newItemId, name, category_id, placeName);
        } catch (mailErr) {
            console.error('메일 발송 준비 중 에러:', mailErr);
            // 메일 발송 실패가 아이템 등록 성공 응답에 영향을 주지 않도록 catch 처리
        }

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: '등록 실패' });
    } finally {
        conn.release();
    }
};

// 2. 분실물 목록 조회 [ver.3 - 커서 페이징으로 OFFSET 제거하여 성능 극대화]
exports.getItems = async (req, res) => {
    try {
        // URL에서 category, cursor, limit 쿼리 파라미터를 가져옴
        const { category, cursor, limit = 20 } = req.query;
        
        const limitNum = parseInt(limit, 10);
        const cacheKey = `items:${category || 'all'}:${cursor || 'start'}:${limitNum}`;

        // Redis 캐시 확인
        const cachedData = await redisClient.GET(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        let query = `
            SELECT item_id, name, image_url, found_date, status, locked_until, category_id, view_count, created_at
            FROM Item 
            WHERE status IN ('보관중', '회수신청중')
        `;
        const queryParams = [];

        // 카테고리 필터
        if (category) {
            query += ` AND category_id = ?`;
            queryParams.push(category);
        }

        // 커서 기반 페이징 (OFFSET 제거)
        if (cursor) {
            const [lastFoundDate, lastCreatedAt] = cursor.split('_');
            query += ` AND (found_date < ? OR (found_date = ? AND created_at < ?))`;
            queryParams.push(lastFoundDate, lastFoundDate, lastCreatedAt);
        }

        // 최신순 정렬
        query += ` ORDER BY found_date DESC, created_at DESC`;

        // 페이징 쿼리
        query += ` LIMIT ?`;
        queryParams.push(limitNum);

        const [rows] = await pool.query(query, queryParams);
        
        // 다음 페이지 커서 생성
        let nextCursor = null;
        if (rows.length === limitNum) {
            const lastItem = rows[rows.length - 1];
            nextCursor = `${lastItem.found_date.toISOString()}_${lastItem.created_at.toISOString()}`;
        }

        // 잠금 상태 및 신청 가능 여부 계산
        const now = new Date();
        const processedRows = rows.map(item => {
            const isLocked = item.locked_until && new Date(item.locked_until) > now;
            const isAvailable = (item.status === '보관중') || (!isLocked && item.status === '회수신청중');

            return {
                ...item,
                is_available: isAvailable, 
                display_status: isAvailable ? '보관중' : '회수신청중' 
            };
        });
        
        const result = {
            items: processedRows,
            nextCursor
        };

        // Redis 캐시 저장 (5분 TTL)
        await redisClient.SETEX(cacheKey, 300, JSON.stringify(result));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. 분실물 상세 조회
exports.getItemDetail = async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query(`UPDATE Item SET view_count = view_count + 1 WHERE item_id = ?`, [id]);

        const [rows] = await pool.query(
            `SELECT i.*, c.name AS category_name, p.address 
             FROM Item i
             JOIN Category c ON i.category_id = c.category_id
             JOIN Place p ON i.place_id = p.place_id
             WHERE i.item_id = ?`, 
            [id]
        );
         
        if (rows.length === 0) return res.status(404).json({ message: '물건 없음' });
        const item = rows[0];
        const now = new Date();
        
        const isLocked = item.locked_until && new Date(item.locked_until) > now;
        let isAvailable = true;
        let lockMessage = null;

        if (item.status === '회수승인' || item.status === '회수완료') {
            isAvailable = false;
            lockMessage = "이미 주인이 찾아간 물건입니다.";
        } else if (isLocked) {
            isAvailable = false;
            const diffHours = Math.ceil((new Date(item.locked_until) - now) / (1000 * 60 * 60));
            lockMessage = `다른 사용자가 회수 신청 중입니다. (잠금 해제까지 약 ${diffHours}시간 남음)`;
        }

        res.json({
            ...item,
            is_available: isAvailable,  
            lock_message: lockMessage   
        });
    } catch (err) {
        console.error('상세조회 에러:', err); // 에러 로그 추가
        res.status(500).json({ error: err.message });
    }
};

// 4. 분실물 삭제 (관리자용)
exports.deleteItem = async (req, res) => {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    try {
        // DB에서 해당 아이템 삭제
        const [result] = await conn.query(`DELETE FROM Item WHERE item_id = ?`, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 물건을 찾을 수 없습니다.' });
        }
        
        res.status(200).json({ message: '분실물이 성공적으로 삭제되었습니다.' });
    } catch (err) {
        console.error('삭제 에러:', err);
        res.status(500).json({ error: '삭제 실패' });
    } finally {
        conn.release();
    }
};