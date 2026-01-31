const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware'); // multer 설정(생략됨, 필요시 구현)
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware'); // jwt 인증(생략됨)

// Controller 불러오기
const itemController = require('../controllers/itemController');
const requestController = require('../controllers/requestController');
const kioskController = require('../controllers/kioskController');

// --- 1. 분실물 등록 & 조회 ---
// 키오스크 등록 (이미지 업로드 포함)
router.post('/items', upload.single('image'), itemController.registerItem);
// 목록 조회 (누구나)
router.get('/items', itemController.getItems);
// 상세 조회 (누구나)
router.get('/items/:id', itemController.getItemDetail);

// --- 2. 회수 신청 & 승인 ---
// 회수 신청 (로그인 필요, 증명사진 업로드)
router.post('/requests', authenticateToken, upload.single('proof_image'), requestController.createRequest);
// 관리자: 신청 목록 보기
router.get('/admin/requests', authenticateToken, isAdmin, requestController.getAdminRequests);
// 관리자: 승인/거절 처리
router.post('/admin/requests/:requestId/process', authenticateToken, isAdmin, requestController.processRequest);

// --- 3. 키오스크 회수 ---
// 내 회수 가능 목록 (키오스크 로그인 직후)
router.get('/kiosk/my-items', authenticateToken, kioskController.getMyRetrievableItems);
// 회수 실행 (박스 오픈)
router.post('/kiosk/retrieve', authenticateToken, kioskController.retrieveItem);

module.exports = router;