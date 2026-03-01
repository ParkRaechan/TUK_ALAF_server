const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken, optionalAuthenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// Controller 불러오기
const itemController = require('../controllers/itemController');
const requestController = require('../controllers/requestController');
const kioskController = require('../controllers/kioskController');
const authController = require('../controllers/authController');

// 인증 관련 API
router.post('/auth/send-code', authController.sendVerificationCode); // 인증번호 발송
router.post('/auth/verify-code', authController.verifyCode);         // 인증번호 확인

// --- [계정 라우터] ---
router.post('/auth/register', authController.register); // 회원가입
router.post('/auth/login', authController.login);       // 로그인

// --- [분실물 등록 & 조회] ---
router.post('/web/items', optionalAuthenticateToken, upload.single('image'), itemController.registerItemWeb);   // 분실물 등록 (웹)
router.post("/items", upload.single("image"), itemController.registerItem); // 분실물 등록 (키오스크)
router.get('/web/items', itemController.getItemsWeb); // 분실물 목록 조회 (웹)
router.get("/items", itemController.getItems);  // 분실물 목록 조회 (키오스크)
router.get("/web/items/:id", itemController.getItemDetailWeb);  // 분실물 상세 조회 (웹)
router.get('/items/:id', itemController.getItemDetail); // 분실물 상세 조회 (키오스크)
router.get('/kiosk/my-requests', authenticateToken, kioskController.getMyApprovedRequests);
router.post('/kiosk/requests/:requestId/complete', authenticateToken, kioskController.completeRetrieval);
// --- [회수 신청 & 승인] ---
router.post('/requests', authenticateToken, upload.single('image'), requestController.createRequest);
router.get('/admin/requests', authenticateToken, isAdmin, requestController.getAdminRequests);
router.post('/admin/requests/:requestId/process', authenticateToken, isAdmin, requestController.processRequest);

// --- [키오스크] 승인된 회수 목록(= 잠금장치 열 수 있는 목록) ---
// ✅ 이건 "승인된 내 목록"이라 로그인 필요 (토큰 유지)
router.get("/kiosk/approved", authenticateToken, kioskController.getApprovedItems);

module.exports = router;