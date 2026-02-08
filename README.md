# 📦 TUK_ALAF Server (TUK 분실물 찾기 프로젝트 서버)

**TUK 분실물 찾기 키오스크 & 웹 서비스의 백엔드 서버**입니다.  
Node.js(Express) 기반으로 구축되었으며, 키오스크 및 웹(React) 클라이언트와 통신하여 분실물 등록, 조회, 회수 신청, 보관함 제어 기능을 수행합니다.

## 🚀 Key Features & Architecture

대용량 트래픽과 안정적인 서비스를 위해 다음과 같은 아키텍처를 도입했습니다.

### 대용량 트래픽
#### 1. Connection Pooling (커넥션 풀링)
다수의 이용자들이 동시다발적으로 접속할 때 DB 연결 과부하를 방지하기 위해 **Connection Pool**을 사용합니다.
- **Why?** 매 요청마다 연결을 생성/해제하면 서버 리소스가 급격히 소모됩니다.
- **How?** 미리 연결 객체를 생성해두고 재사용하여 응답 속도를 최적화했습니다.

```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // 동시 연결 최대 10개 유지
    queueLimit: 0,
    timezone: '+09:00'
});
```
#### 2. Cluster Mode (PM2 - 배포 환경) 아직 미적용
Node.js의 싱글 스레드 한계를 극복하기 위해 **PM2 클러스터 모드**를 지원합니다.
- **Why?** 싱글 스레드는 CPU 코어를 1개만 사용하므로, 트래픽이 몰릴 때 비효율적입니다.
- **How?** 서버 CPU 코어 개수만큼 프로세스를 복제하여 병렬 처리 성능을 극대화합니다.
```Bash
#설치
npm install pm2 -g
#실행 (모든 CPU 코어 활용)
pm2 start server.js -i max
```
#### 3. Redis Caching (성능 최적화) ..아직 미적용
Redis 캐시 사용

- **Why?** 잦은 조회(분실물 목록 등) 시 매번 무거운 DB 쿼리를 실행하는 것은 비효율적입니다.
- **How?** Redis를 인메모리 캐시로 활용하여 반복되는 조회 데이터나 JWT 블랙리스트, 세션 데이터를 초고속으로 처리합니다.
### 데이터 무결성
#### 1. Transactions 적용
- **Why?** 회수 신청 시 '잠금 시간 설정'과 '신청서 작성'은 동시에 일어나야 합니다. 하나만 성공하고 하나가 실패하면 데이터가 꼬이게 됩니다.
- **How?** START TRANSACTION을 통해 신청-잠금-포인트 지급 로직을 하나의 원자적 단위로 묶어, 오류 발생 시 모든 작업을 이전 상태로 되돌리는(Rollback) 안전장치를 마련했습니다.
### 로깅
#### 1. 로그 파일 ..아직 미적용
....진행중....

## 📂 Directory Structure
```Plaintext
tuk_alaf_server/
├── config/
│   ├── db.js           # MySQL Connection Pool
│   └── redis.js        # Redis Client 설정 (추가)
├── controllers/
│   ├── authController.js    # 회원가입/로그인/이메일 인증
│   ├── itemController.js    # 분실물 등록/조회 (Transaction 적용)
│   └── requestController.js # 회수 신청/승인 (Lock 로직 포함)
├── middlewares/
│   ├── authMiddleware.js    # JWT & Role(Admin) 검증
│   └── uploadMiddleware.js  # Multer 파일 처리
├── utils/
│   ├── logger.js       # Winston 로깅 설정 (추가)
│   └── validator.js    # 입력 데이터 검증 유틸리티
├── logs/               # 서버 운영 로그 저장소 (추가)
│   ├── error.log
│   └── access.log
├── routes/
│   └── apiRoutes.js    # 라우팅 통합 관리
├── uploads/            # 분실물/증빙 이미지 저장소
├── server.js           # Entry Point
└── .env                # 환경 변수 (DB_PW, JWT_SECRET 등)
```

## 🛠 Installation & Setup
### 1. 환경 설정
프로젝트를 클론하고 필요한 모듈을 설치합니다.
```Bash
mkdir TUK_ALAF_SERVER
cd TUK_ALAF_SERVER

#의존성 설치
# 기본 프레임워크 및 DB
npm install express mysql2 dotenv cors
# 보안 및 인증
npm install jsonwebtoken bcryptjs helmet
# 로깅 및 파일 처리 (고려중)
# npm install winston winston-daily-rotate-file morgan multer
# 캐싱 및 유틸리티 (아직 미적용)
# npm install ioredis
# 개발 도구
npm install -D nodemon
```

### 2. 데이터베이스 세팅
아래의 SQL 스크립트를 실행하여 테이블을 생성하고 기초 데이터를 삽입합니다. (기존 테이블이 있다면 초기화되니 주의하세요)
<details> <summary>👉 <b>DB 초기화 SQL 스크립트 보기 (Click)</b></summary>
  
  ```SQL
-- 1. 외래키 체크 해제
SET FOREIGN_KEY_CHECKS = 0;

-- 2. 기존 테이블 초기화
DROP TABLE IF EXISTS Comment, PostImage, Post, RetrievalRequest, Item, Notification, Member, Place, Category;

-- 3. 테이블 생성
CREATE TABLE Category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE Place (
    place_id INT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(100) NOT NULL,
    detail_address VARCHAR(100)
);

CREATE TABLE Member (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    point INT DEFAULT 0,
    has_retrieval_permission BOOLEAN DEFAULT TRUE,
    phone_number VARCHAR(20) NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER'
);

CREATE TABLE Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    category_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE CASCADE
);

CREATE TABLE Item (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    finder_id INT,
    place_id INT NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    locker_number INT, 
    status VARCHAR(20) DEFAULT '보관중',
    found_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_until DATETIME,
    is_retrieved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (finder_id) REFERENCES Member(member_id) ON DELETE SET NULL,
    FOREIGN KEY (place_id) REFERENCES Place(place_id),
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

CREATE TABLE RetrievalRequest (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    requester_id INT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COLLECTED') DEFAULT 'PENDING',
    proof_image_url VARCHAR(255),
    proof_detail_address VARCHAR(255),
    proof_description TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Item(item_id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES Member(member_id) ON DELETE CASCADE
);

CREATE TABLE Post (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    member_id INT NOT NULL,
    post_type ENUM('LOST', 'LOOKING_FOR') NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

CREATE TABLE PostImage (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE
);

CREATE TABLE Comment (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    member_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
```
</details>

## ✅ API Test Status
현재 임시 구현 및 테스트가 완료된 API 목록입니다.
| Method | Endpoint | Description | Status | Note |
| :--- | :--- | :--- | :---: | :--- |
| **POST** | `/api/auth/register` | 회원가입 | ✅ 완료 | 비밀번호 Bcrypt 암호화 저장 |
| **POST** | `/api/auth/login` | 로그인 (JWT 발급) | ✅ 완료 | 엑세스 토큰 반환 |
| **GET** | `/api/items` | 분실물 목록 조회 | ✅ 완료 | `is_available` 플래그 포함 |
| **GET** | `/api/items/:id` | 분실물 상세 조회 | ✅ 완료 | 잠금 상태 및 남은 시간 표시 |
| **POST** | `/api/items` | 분실물 등록 (키오스크/유저) | ✅ 완료 | `finder_id` 자동 할당 및 포인트 지급 |
| **POST** | `/api/requests` | 회수 신청 (48시간 선점) | ✅ 완료 | **트랜잭션 적용**, 48시간 잠금 로직 |
| **GET** | `/api/admin/requests` | 관리자 - 미처리 신청 목록 | ✅ 완료 | 관리자 권한(`isAdmin`) 필수 |
| **POST** | `/api/admin/requests/:id/process` | 관리자 - 승인/거절 처리 | ✅ 완료 | 거절 시 즉시 잠금 해제(Lock Reset) |
| **GET** | `/api/kiosk/my-items` | 내 회수 가능 목록 (키오스크) | ✅ 완료 | 승인(`APPROVED`)된 물건만 노출 |
| **POST** | `/api/kiosk/retrieve` | 보관함 문 열기 및 수령 | ✅ 완료 | `is_retrieved` 상태 업데이트 |
| **GET** | `/uploads/:file` | 이미지 파일 로드 | ✅ 완료 | 정적 파일 서빙 |

## 📝 TODO (Roadmap)
- [x] 관리자 승인 API: 웹 관리자 페이지에서 회수 요청을 승인/거절하는 로직 및 트랜잭션 구현
- [x] 48시간 회수 신청 잠금(Lock): 동시 신청 방지 및 비즈니스 로직 고도화
- [ ] 이메일 인증 API: 회원가입 시 학교 이메일(@tuk.ac.kr) 인증 로직 연동
- [ ] 커뮤니티(게시판) 기능: 보관함 외 직접 전달 물건을 위한 글쓰기 및 댓글 기능
- [ ] 마이페이지 고도화: 내 포인트 내역, 내가 등록/신청한 물건 상태 추적
- [ ] 실시간 알림 서비스: 관심 카테고리 물건 등록 시 이메일 알림(Push) 발송
- [ ] 보관함 제어 실제 연동: 라즈베리 파이 하드웨어 제어 신호 연동
- [ ] 운영 보안 강화: CORS 설정, Rate Limiting(요청 횟수 제한), HTTPS 적용
