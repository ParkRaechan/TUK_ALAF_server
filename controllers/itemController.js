const pool = require('../config/db');

// 1. 분실물 등록 (웹 전용)
exports.registerItemWeb = async (req, res) => {
    // 이미지 파일 경로 처리
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // 요청 바디 데이터
    const { name, category_id, place_id, detail_address, description, found_date } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

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
            (name, category_id, place_id, detail_address, description, found_date, finder_id, image_url, locker_number, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '보관중')`,
            [name, category_id, place_id, detail_address, description, found_date, finder_id, imageUrl, locker_number]
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
// 1-2. 분실물 등록 (키오스크 전용)
exports.registerItem = async (req, res) => {
  // 이미지 파일 경로 처리
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  // 요청 바디 데이터
  const { name, category_id, place_id, description, found_date } = req.body;

  // ✅ found_date 방어 (핵심)
  const safeFoundDate = normalizeFoundDate(found_date);
  if (!safeFoundDate) {
    return res.status(400).json({
      error: "found_date 형식이 올바르지 않습니다. (YYYY-MM-DD)",
    });
  }

  // ✅ 필수값 최소 검증
  if (!name) {
    return res.status(400).json({ error: "필수값 누락: name" });
  }

  const safeCategoryId = toPositiveInt(category_id);
  const safePlaceId = toPositiveInt(place_id);

  if (!safeCategoryId || !safePlaceId) {
    return res.status(400).json({
      error: "필수값 누락/형식 오류: category_id, place_id는 양의 정수여야 합니다.",
    });
  }

  // 로그인한 상태(토큰 있음)라면 req.user.id를 사용, 아니면 null (익명 습득)
  const finder_id = req.user ? req.user.id : null;

  // 보관함 번호 기본값 설정 (요청에 없으면 1번)
  const safeLockerNumber = toPositiveInt(req.body.locker_number) || 1;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 분실물 DB 저장
    const [result] = await conn.query(
      `INSERT INTO Item
        (name, category_id, place_id, description, found_date, finder_id, image_url, locker_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '보관중')`,
      [
        String(name).trim(),
        safeCategoryId,
        safePlaceId,
        description ?? "",
        safeFoundDate,
        finder_id,
        imageUrl,
        safeLockerNumber,
      ]
    );

    // 2) 로그인한 회원이 등록했을 경우 포인트 지급
    if (finder_id) {
      await conn.query(
        `UPDATE Member SET point = point + 100 WHERE member_id = ?`,
        [finder_id]
      );
    }

    await conn.commit();
    return res.status(201).json({
      message: "분실물 등록 완료",
      itemId: result.insertId,
      found_date: safeFoundDate,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: "등록 실패" });
  } finally {
    conn.release();
  }
};


// 2. 분실물 목록 조회 (웹)
exports.getItemsWeb = async (req, res) => {
    try {
        // URL에서 category 쿼리 파라미터를 가져옴 (예: /api/items?category=1)
        const { category } = req.query;        
        let query = `
            SELECT item_id, name, image_url, found_date, status, locked_until, category_id
            FROM Item 
            WHERE status IN ('보관중', '회수신청중')
        `;
        const queryParams = [];

        // 만약 카테고리 필터가 들어왔다면 조건 추가
        if (category) {
            query += ` AND category_id = ?`;
            queryParams.push(category);
        }

        // 최신순 정렬 추가
        query += ` ORDER BY found_date DESC, created_at DESC`;

        const [rows] = await pool.query(query, queryParams);
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
// 2-2. 분실물 목록 조회 (키오스크)
exports.getItems = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT item_id, name, image_url, created_at, status, locked_until
       FROM Item
       WHERE status IN ('보관중', '회수신청중')
       ORDER BY created_at DESC`
    );

    const now = new Date();
    const processedRows = rows.map((item) => {
      const isLocked = item.locked_until && new Date(item.locked_until) > now;
      const isAvailable =
        item.status === "보관중" || (!isLocked && item.status === "회수신청중");

      return {
        ...item,
        is_available: isAvailable,
        display_status: isAvailable ? "보관중" : "회수신청중",
      };
    });

    return res.json(processedRows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. 분실물 상세 조회(웹)
exports.getItemDetailWeb = async (req, res) => {
    const { id } = req.params;
    
    try {
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
// 3-2. 분실물 상세 조회(키오스크)
exports.getItemDetail = async (req, res) => {
  const { id } = req.params;

  const safeId = toPositiveInt(id);
  if (!safeId) return res.status(400).json({ error: "id 형식 오류" });

  try {
    const [rows] = await pool.query(
      `SELECT i.*, c.name AS category_name, p.address, p.detail_address
       FROM Item i
       JOIN Category c ON i.category_id = c.category_id
       JOIN Place p ON i.place_id = p.place_id
       WHERE i.item_id = ?`,
      [safeId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "물건 없음" });

    const item = rows[0];
    const now = new Date();

    const isLocked = item.locked_until && new Date(item.locked_until) > now;

    let isAvailable = true;
    let lockMessage = null;

    if (item.status === "회수승인" || item.status === "회수완료") {
      isAvailable = false;
      lockMessage = "이미 주인이 찾아간 물건입니다.";
    } else if (isLocked) {
      isAvailable = false;
      const diffHours = Math.ceil(
        (new Date(item.locked_until) - now) / (1000 * 60 * 60)
      );
      lockMessage = `다른 사용자가 회수 신청 중입니다. (잠금 해제까지 약 ${diffHours}시간 남음)`;
    }

    return res.json({
      ...item,
      is_available: isAvailable,
      lock_message: lockMessage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



// ===== 공통 유틸: 날짜 기본값/검증 =====
function todayYYYYMMDD() {
  // 서버 시간 기준(UTC)이라 현지(KST) 기준으로 맞추고 싶으면 별도 처리 필요
  return new Date().toISOString().slice(0, 10);
}

function normalizeFoundDate(found_date_raw) {
  // 1) 없거나 'undefined'/'null'/빈문자면 오늘 날짜
  if (
    found_date_raw === undefined ||
    found_date_raw === null ||
    String(found_date_raw).trim() === "" ||
    String(found_date_raw).trim().toLowerCase() === "undefined" ||
    String(found_date_raw).trim().toLowerCase() === "null"
  ) {
    return todayYYYYMMDD();
  }

  const s = String(found_date_raw).trim();

  // 2) ISO 형태(2026-02-12T...)로 오면 앞의 날짜만 자르기
  const datePart = s.includes("T") ? s.split("T")[0] : s;

  // 3) YYYY-MM-DD 간단 검증
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return null; // 잘못된 형식
  }

  return datePart;
}

function toPositiveInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}
