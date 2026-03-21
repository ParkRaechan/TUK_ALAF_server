const pool = require('../config/db');

// 1. 커뮤니티 게시글 등록 (회원 전용)
exports.createPost = async (req, res) => {
    // 요청 바디 데이터 (post_type: 'LOST' 또는 'LOOKING_FOR')
    const { title, content, post_type, category_id } = req.body;
    const member_id = req.user.id; // authenticateToken 미들웨어 통과 필수

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1) Post 테이블에 게시글 저장
        const [postResult] = await conn.query(
            `INSERT INTO Post (title, content, member_id, post_type, category_id)
             VALUES (?, ?, ?, ?, ?)`,
            [title, content, member_id, post_type, category_id]
        );
        
        const newPostId = postResult.insertId;

        // 2) 이미지가 있다면 PostImage 테이블에 저장
        if (imageUrl) {
            await conn.query(
                `INSERT INTO PostImage (post_id, image_url) VALUES (?, ?)`,
                [newPostId, imageUrl]
            );
        }

        // 3) 글 작성 시 포인트 지급 (선택 사항, 필요 없으면 삭제 가능)
        await conn.query(
            `UPDATE Member SET point = point + 10 WHERE member_id = ?`, 
            [member_id]
        );

        await conn.commit();
        res.status(201).json({ message: '커뮤니티 게시글 등록 완료', postId: newPostId });
    } catch (err) {
        await conn.rollback();
        console.error('게시글 등록 에러:', err);
        res.status(500).json({ error: '게시글 등록 실패' });
    } finally {
        conn.release();
    }
};

// 2. 커뮤니티 게시글 목록 조회 (페이징 적용)
exports.getPosts = async (req, res) => {
    try {
        const { type, category, page = 1, limit = 20 } = req.query;        
        
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT p.post_id, p.title, p.post_type, p.created_at, 
                   m.name AS author_name, c.name AS category_name,
                   (SELECT image_url FROM PostImage WHERE post_id = p.post_id LIMIT 1) AS thumbnail
            FROM Post p
            JOIN Member m ON p.member_id = m.member_id
            JOIN Category c ON p.category_id = c.category_id
            WHERE 1=1
        `;
        const queryParams = [];

        // 유형 필터 (습득물만 보기, 찾는물건만 보기)
        if (type && (type === 'LOST' || type === 'LOOKING_FOR')) {
            query += ` AND p.post_type = ?`;
            queryParams.push(type);
        }

        // 카테고리 필터
        if (category) {
            query += ` AND p.category_id = ?`;
            queryParams.push(category);
        }

        query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(limitNum, offset);

        const [rows] = await pool.query(query, queryParams);
        
        res.json(rows);
    } catch (err) {
        console.error('게시글 목록 조회 에러:', err);
        res.status(500).json({ error: err.message });
    }
};

// 3. 커뮤니티 게시글 상세 조회 (채팅 버튼 활성화를 위해)
exports.getPostDetail = async (req, res) => {
    const { id } = req.params;
    
    try {
        // 게시글 정보 및 작성자 정보 가져오기
        const [postRows] = await pool.query(
            `SELECT p.*, m.name AS author_name, c.name AS category_name 
             FROM Post p
             JOIN Member m ON p.member_id = m.member_id
             JOIN Category c ON p.category_id = c.category_id
             WHERE p.post_id = ?`, 
            [id]
        );
        
        if (postRows.length === 0) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        
        // 이미지 목록 가져오기
        const [imageRows] = await pool.query(
            `SELECT image_url FROM PostImage WHERE post_id = ?`,
            [id]
        );

        const post = postRows[0];
        post.images = imageRows.map(img => img.image_url);

        // 프론트엔드에서 현재 로그인한 유저 ID와 post.member_id가 다르면 [채팅하기] 버튼 노출
        
        res.json(post);
    } catch (err) {
        console.error('게시글 상세조회 에러:', err);
        res.status(500).json({ error: err.message });
    }
};