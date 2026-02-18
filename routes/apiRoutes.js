const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');

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
router.post('/items', authenticateToken, upload.single('image'), itemController.registerItem);
router.get('/items', itemController.getItems);
router.get('/items/:id', itemController.getItemDetail);
// --- [회수 신청 & 승인] ---
router.post('/requests', authenticateToken, upload.single('image'), requestController.createRequest);
router.get('/admin/requests', authenticateToken, isAdmin, requestController.getAdminRequests);
router.post('/admin/requests/:requestId/process', authenticateToken, isAdmin, requestController.processRequest);

/*
// --- [키오스크 관련 라우터] ---
router.get('/kiosk/my-items', authenticateToken, kioskController.getMyRetrievableItems);
router.post('/kiosk/retrieve', authenticateToken, kioskController.retrieveItem);
*/

module.exports = router;