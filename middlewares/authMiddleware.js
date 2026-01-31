// 1. 토큰 인증 미들웨어 (테스트용: 무조건 통과 + 1번 유저로 간주)
exports.authenticateToken = (req, res, next) => {
    // 실제로는 여기서 JWT 토큰을 검사해야 하지만,
    // 지금은 테스트를 위해 "무조건 id가 1인 유저가 로그인했다"고 가정합니다.
    req.user = { 
        id: 1, 
        role: 'ADMIN' // 관리자 테스트도 되게 일단 ADMIN으로 설정
    };
    console.log('✅ 인증 미들웨어 통과 (Test Mode)');
    next(); // 다음 단계(Controller)로 넘어감
};

// 2. 관리자 권한 확인 미들웨어 (테스트용: 무조건 통과)
exports.isAdmin = (req, res, next) => {
    console.log('✅ 관리자 권한 확인 (Test Mode)');
    next(); 
};