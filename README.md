# 📦 TUK_ALAF Server (TUK 분실물 찾기 프로젝트 서버)

**TUK 분실물 찾기 키오스크 & 웹 서비스의 백엔드 서버**입니다.  
Node.js(Express) 기반으로 구축되었으며, 키오스크(Flutter) 및 웹(React) 클라이언트와 통신하여 분실물 등록, 조회, 회수 신청, 보관함 제어 기능을 수행합니다.

## 🚀 Key Features & Architecture

대용량 트래픽과 안정적인 서비스를 위해 다음과 같은 아키텍처를 도입했습니다.

### 1. Connection Pooling (커넥션 풀링)
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

### 2. Cluster Mode (PM2 - 배포 환경)
Node.js의 싱글 스레드 한계를 극복하기 위해 **PM2 클러스터 모드**를 지원합니다.

- **Why?** 싱글 스레드는 CPU 코어를 1개만 사용하므로, 트래픽이 몰릴 때 비효율적입니다.
- **How?** 서버 CPU 코어 개수만큼 프로세스를 복제하여 병렬 처리 성능을 극대화합니다.


```Bash
#설치
npm install pm2 -g
#실행 (모든 CPU 코어 활용)
pm2 start server.js -i max
```

### 📂 Directory Structure
```Plaintext
tuk_alaf_server/
├── config/
│   └── db.js            # MySQL Connection Pool 설정
├── middlewares/
│   ├── authMiddleware.js   # JWT 기반 로그인 인증
│   └── uploadMiddleware.js # Multer 이미지 업로드 처리
├── controllers/
│   ├── itemController.js   # 분실물 등록 & 조회 로직
│   ├── requestController.js# 회수 신청 & 승인 로직
│   └── kioskController.js  # 키오스크 회수(보관함 Open) 로직
├── routes/
│   ├── apiRoutes.js        # API 라우팅 통합 관리
├── uploads/             # 이미지 파일 저장소
├── server.js            # 서버 진입점 (Server Entry)
└── .env                 # 환경 변수 설정
```

### 🛠 Installation & Setup
#### 1. 환경 설정
프로젝트를 클론하고 필요한 모듈을 설치합니다.
```Bash
mkdir TUK_ALAF_SERVER
cd TUK_ALAF_SERVER

#의존성 설치
npm install express mysql2 socket.io cors dotenv morgan helmet multer jsonwebtoken
npm install -D nodemon
```

#### 2. 데이터베이스 세팅
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
-- 4. 기초 데이터 삽입
INSERT INTO Category (name) VALUES ('전자기기'), ('지갑/카드');
INSERT INTO Place (address, detail_address) VALUES ('공학관 E동', '1층 로비'), ('도서관', '열람실');
INSERT INTO Member (name, email, password, phone_number, role, point) 
VALUES ('홍길동', 'test@tuk.ac.kr', '1234', '010-1234-5678', 'USER', 0);
INSERT INTO Member (name, email, password, phone_number, role, point) 
VALUES ('관리자', 'admin@tuk.ac.kr', '1234', '010-0000-0000', 'ADMIN', 0);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
```
</details>

### ✅ API Test Status
현재 임시 구현 및 테스트가 완료된 API 목록입니다.
```
Method,Endpoint,Description,Status,Note
GET,/api/items,분실물 목록 조회 (전체),✅ 완료,응답시간: ~1.8ms
POST,/api/items,분실물 등록 (키오스크),✅ 완료,이미지 업로드 및 DB 저장
GET,/uploads/:file,이미지 파일 로드,✅ 완료,정적 파일 서빙
POST,/api/requests,회수 신청 (웹 유저),✅ 완료,Auth Middleware 통과
GET,/api/kiosk/my-items,내 회수 가능 목록 (키오스크),✅ 완료,승인된 물건 조회
```

### 📝 TODO (Roadmap)
다음 단계에서 구현할 기능 목록입니다.
```
[ ] 관리자 승인 API: 웹 관리자 페이지에서 회수 요청을 승인/거절하는 로직
[ ] 보관함 제어 연동: 실제 하드웨어 신호 연동 (현재는 로직만 구현됨)
[ ] 기능 완전 구현: 로컬 테스트 모듈을 구체화
```
