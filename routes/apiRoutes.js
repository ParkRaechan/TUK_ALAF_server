const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken, optionalAuthenticateToken, isAdmin } = require('../middlewares/authMiddleware');

// Controller 불러오기
const itemController = require('../controllers/itemController');
const requestController = require('../controllers/requestController');
const kioskController = require('../controllers/kioskController');
const authController = require('../controllers/authController');
const notificationController = require('../controllers/notificationController');
const postController = require('../controllers/postController');

// 인증 관련 API
router.post('/auth/send-code', authController.sendVerificationCode); // 인증번호 발송
router.post('/auth/verify-code', authController.verifyCode);         // 인증번호 확인

// --- [계정 라우터] ---
router.post('/auth/register', authController.register); // 회원가입
router.post('/auth/login', authController.login);       // 로그인

// --- [분실물 등록 & 조회] ---
router.post('/items', optionalAuthenticateToken, upload.single('image'), itemController.registerItem);
router.get('/items', itemController.getItems);
router.get('/items/:id', itemController.getItemDetail);
router.delete('/items/:id', authenticateToken, isAdmin, itemController.deleteItem);
router.post('/kiosk/requests/:requestId/complete', authenticateToken, kioskController.completeRetrieval);
// --- [회수 신청 & 승인] ---
router.post('/requests', authenticateToken, upload.single('image'), requestController.createRequest);
router.get('/admin/requests', authenticateToken, isAdmin, requestController.getAdminRequests);
router.post('/admin/requests/:requestId/process', authenticateToken, isAdmin, requestController.processRequest);
// --- [키오스크] 승인된 회수 목록(= 잠금장치 열 수 있는 목록) ---
router.get("/kiosk/approved", authenticateToken, kioskController.getApprovedItems);

// --- [이메일 알람 신청] --- 로그인한 유저만 쓸 수 있도록 인증 미들웨어(authenticateToken)
router.get('/alerts', authenticateToken, notificationController.getUserAlerts);
router.post('/alerts', authenticateToken, notificationController.updateUserAlerts);

// --- [커뮤니티(게시판) 라우터] ---
// 커뮤니티 목록 및 상세 조회
router.get('/posts', postController.getPosts);
router.get('/posts/:id', postController.getPostDetail);
// 커뮤니티 글쓰기 (회원만 가능 -> authenticateToken 적용)
router.post('/posts', authenticateToken, upload.single('image'), postController.createPost);

module.exports = router;