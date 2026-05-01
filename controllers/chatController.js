// controllers/chatController.js
const db = require('../config/db'); // DB 설정 파일 경로

exports.createOrGetRoom = async (req, res) => {
    console.log("🔥 토큰에서 꺼낸 유저 정보:", req.user);

    const { itemId, postId, receiverId } = req.body;
    const initiatorId = req.user.id; // 토큰에서 가져온 내 ID

    try {
        // 1. 이미 존재하는 방이 있는지 확인
        let checkQuery = `SELECT * FROM ChatRoom WHERE initiator_id = ? AND receiver_id = ?`;
        let queryParams = [initiatorId, receiverId];
        
        if (itemId) { checkQuery += ` AND item_id = ?`; queryParams.push(itemId); }
        if (postId) { checkQuery += ` AND post_id = ?`; queryParams.push(postId); }

        const [existingRoom] = await db.query(checkQuery, queryParams);

        if (existingRoom.length > 0) {
            return res.status(200).json({ roomId: existingRoom[0].room_id });
        }

        // 2. 방이 없으면 새로 생성
        const insertQuery = `INSERT INTO ChatRoom (item_id, post_id, initiator_id, receiver_id) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(insertQuery, [itemId || null, postId || null, initiatorId, receiverId]);
        
        res.status(201).json({ roomId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '채팅방 생성 오류' });
    }
};

exports.getChatHistory = async (req, res) => {
    const { roomId } = req.params;
    try {
        const query = `
            SELECT m.*, u.name as sender_name 
            FROM ChatMessage m 
            JOIN Member u ON m.sender_id = u.member_id 
            WHERE m.room_id = ? 
            ORDER BY m.created_at ASC
        `;
        const [messages] = await db.query(query, [roomId]);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: '메시지 내역 조회 오류' });
    }
};

exports.saveMessage = async (req, res) => {
    const { roomId, message } = req.body;
    const senderId = req.user.id;
    try {
        console.log("🔥 [메시지 전송] 넘어온 body:", req.body);
        console.log("🔥 [메시지 전송] 내 정보(user):", req.user);
        const query = `INSERT INTO ChatMessage (room_id, sender_id, message) VALUES (?, ?, ?)`;
        await db.query(query, [roomId, senderId, message]);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("🚨 [메시지 전송 실패 이유]:", error);
        res.status(500).json({ message: '메시지 저장 오류' });
    }
};

exports.getChatRoomList = async (req, res) => {
    const userId = req.user.id; // 내 ID

    try {
        // CASE 문을 사용해 내가 initiator면 receiver의 이름을, 내가 receiver면 initiator의 이름을 가져옵니다.
        const query = `
            SELECT 
                cr.room_id, 
                cr.post_id, 
                cr.item_id,
                cr.created_at,
                m.name AS partner_name
            FROM ChatRoom cr
            JOIN Member m ON m.member_id = CASE 
                WHEN cr.initiator_id = ? THEN cr.receiver_id 
                ELSE cr.initiator_id 
            END
            WHERE cr.initiator_id = ? OR cr.receiver_id = ?
            ORDER BY cr.created_at DESC
        `;
        // ? 자리에 들어갈 내 ID 3개
        const [rooms] = await db.query(query, [userId, userId, userId]);
        
        res.status(200).json(rooms);
    } catch (error) {
        console.error("🚨 [채팅방 목록 조회 오류]:", error);
        res.status(500).json({ message: '채팅방 목록을 불러오는데 실패했습니다.' });
    }
};