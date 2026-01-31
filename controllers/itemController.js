const pool = require('../config/db');

// 1. 분실물 등록 (키오스크)
exports.registerItem = async (req, res) => {
    // 이미지 파일은 uploadMiddleware를 통해 req.file에 담김
    const { name, category_id, place_id, description, found_date, finder_id } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // 하드웨어 박스 번호 할당 (임의로 1번 박스(키오스크)에 넣는다고 가정)
    // 실제로는 빈 박스를 찾는 로직이 필요함
    const assignedLockerNum = 1; 

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // [Hardware Mock] 박스 열림/닫힘 감지 로직 (주석 처리됨)
        // console.log(`🔓 ${assignedLockerNum}번 박스 열림... 물건 감지 중...`);
        // await new Promise(r => setTimeout(r, 2000)); // 20초 대기 (물건 넣는 시간)
        // console.log(`🔒 ${assignedLockerNum}번 박스 닫힘.`);

        // DB 저장
        const [result] = await conn.query(
            `INSERT INTO Item 
            (name, category_id, place_id, description, found_date, finder_id, image_url, locker_number, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, '보관중')`,
            [name, category_id, place_id, description, found_date, finder_id || null, imageUrl, assignedLockerNum]
        );

        // 회원이 등록했을 경우 포인트 지급
        if (finder_id) {
            await conn.query(`UPDATE Member SET point = point + 100 WHERE member_id = ?`, [finder_id]);
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

// 2. 분실물 목록 조회 (웹/앱 - 이미지와 이름만)
exports.getItems = async (req, res) => {
    try {
        // 보관중인 물건만 보여줌
        const [rows] = await pool.query(
            `SELECT item_id, name, image_url, created_at 
             FROM Item 
             WHERE status = '보관중' 
             ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. 분실물 상세 조회 (상세페이지)
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
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};