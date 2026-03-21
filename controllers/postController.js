const pool = require('../config/db');

// 1. 커뮤니티 게시글 등록
exports.createPost = async (req, res) => {
    const { title, content, post_type, category_id } = req.body;
    const member_id = req.user.id; 

    // 이미지가 있으면 경로 저장, 없으면 null
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [postResult] = await conn.query(
            `INSERT INTO Post (title, content, member_id, post_type, category_id, image_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, content, member_id, post_type, category_id, imageUrl]
        );
        
        await conn.commit();
        res.status(201).json({ message: '커뮤니티 게시글 등록 완료', postId: postResult.insertId });
    } catch (err) {
        await conn.rollback();
        console.error('게시글 등록 에러:', err);
        res.status(500).json({ error: '게시글 등록 실패' });
    } finally {
        conn.release();
    }
};

// 2. 커뮤니티 게시글 목록 조회
exports.getPosts = async (req, res) => {
    try {
        const { type, category, page = 1, limit = 20 } = req.query;        
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        let query = `
            SELECT p.post_id, p.title, p.post_type, p.created_at, 
                   p.image_url AS thumbnail, -- 여기서 바로 썸네일로 뽑아옵니다
                   m.name AS author_name, c.name AS category_name
            FROM Post p
            JOIN Member m ON p.member_id = m.member_id
            JOIN Category c ON p.category_id = c.category_id
            WHERE 1=1
        `;
        const queryParams = [];

        if (type && (type === 'LOST' || type === 'LOOKING_FOR')) {
            query += ` AND p.post_type = ?`;
            queryParams.push(type);
        }

        if (category) {
            query += ` AND p.category_id = ?`;
            queryParams.push(category);
        }

        query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit, 10), offset);

        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        console.error('게시글 목록 조회 에러:', err);
        res.status(500).json({ error: err.message });
    }
};

// 3. 커뮤니티 게시글 상세 조회
exports.getPostDetail = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [postRows] = await pool.query(
            `SELECT p.*, m.name AS author_name, c.name AS category_name 
             FROM Post p
             JOIN Member m ON p.member_id = m.member_id
             JOIN Category c ON p.category_id = c.category_id
             WHERE p.post_id = ?`, 
            [id]
        );
        
        if (postRows.length === 0) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        
        const post = postRows[0];
        
        post.images = post.image_url ? [post.image_url] : [];
        
        res.json(post);
    } catch (err) {
        console.error('게시글 상세조회 에러:', err);
        res.status(500).json({ error: err.message });
    }
};