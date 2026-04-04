# 📦 TUK_ALAF Server (TUK 분실물 찾기 프로젝트 서버)

**TUK 분실물 찾기 키오스크 & 웹 서비스의 백엔드 서버**입니다.  
Node.js(Express) 기반으로 구축되었으며, 키오스크 및 웹(React) 클라이언트와 통신하여 분실물 등록, 조회, 회수 신청, 보관함 제어 기능을 수행합니다.

## 🚀 Key Features & Architecture

대용량 트래픽과 안정적인 서비스를 위해 다음과 같은 아키텍처를 도입했습니다.

### 1) 대용량 트래픽
##### 1. Connection Pooling (커넥션 풀링 적용 완료)
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
##### 2. 무중단 배포 및 Cluster Mode (PM2 적용 완료 🚀)
Node.js의 싱글 스레드 한계를 극복하고 24시간 안정적인 서버 운영을 위해 **PM2**를 도입했습니다.
- **Why?** 터미널 접속이 끊어져도 서버가 죽지 않게(무중단 배포) 유지하며, 트래픽이 몰릴 때 CPU 코어를 최대한 활용하기 위함입니다.
- **How?** 현재 네이버 클라우드(NCP) 우분투 환경에서 PM2를 통해 백그라운드 무중단 서비스로 동작 중입니다.

```bash
# 글로벌 설치 및 무중단 실행 (현재 서버 적용 완료)
npm install pm2 -g
pm2 start server.js --name "tuk-alaf-api"
```
##### 3. 대규모 데이터 부하 테스트 및 Pagination (페이징 적용 완료 ⚡)
- **Why?** 분실물 데이터가 누적되었을 때, 한 번에 모든 데이터를 응답하면 브라우저 렌더링 병목(Freezing) 및 서버 메모리 과부하가 발생합니다.
- **How?** DB에 10,000건의 더미 데이터를 삽입하여 부하 테스트를 진행했습니다. 전체 데이터 로드 시 224ms까지 치솟았던 초기 응답 시간(TTFB)을, `LIMIT`과 `OFFSET`을 활용한 **백엔드 페이징(Pagination) 및 프론트엔드 무한 스크롤(더보기) 아키텍처**로 개편하여 **10~20ms 수준으로 대폭 단축**시켰습니다.

##### 4. 성능 최적화 (Redis Caching 적용 완료)
- **Why?** 이메일 인증번호 같은 휘발성 데이터를 RDBMS(MySQL)에 저장하면 불필요한 디스크 I/O가 발생하며, 스케줄러로 만료 데이터를 주기적으로 삭제해야 하는 오버헤드가 생깁니다.
- **How?** 초고속 인메모리 DB인 Redis를 도입하여 성능을 극대화했습니다. 발급된 인증 코드는 Redis에 저장되며, setEx 메서드를 통해 3분(180초) TTL(Time-To-Live)을 부여하여 시간이 지나면 서버의 개입 없이 자동으로 삭제되도록 아키텍처를 구성했습니다. 또한, 인증 성공 시 즉시 캐시를 비워 재사용 공격(Replay Attack)을 차단했습니다.
```JavaScript
// Redis 기반 인증번호 180초 자동 만료 세팅
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

// 데이터 저장 및 TTL 180초 동시 적용
await redisClient.setEx(`authCode:${email}`, 180, code);
```
### 2) 서버 인프라 및 보안 (3중 방어 구축 🛡️)
상용 서비스 수준의 안전한 클라우드 운영을 위해 강력한 보안 계층을 적용했습니다.
- **네트워크 보안 (ACG 방화벽):** 네이버 클라우드 ACG를 통해 22번(SSH) 포트를 특정 개발자 IP에서만 접근 가능하도록 화이트리스트 통제 적용.
- **시스템 보안 (SSH Key 강제화):** Brute-force 공격 방지를 위해 비밀번호 기반 로그인을 원천 차단(`PasswordAuthentication no`)하고, RSA 4096비트 SSH Key 인증 방식만 허용.
- **어플리케이션 감시 (Fail2Ban):** 비정상적인 접근 시도를 실시간으로 모니터링하여, 악의적인 IP를 자동으로 차단하는 보안 시스템 구축 완료.

### 3) 데이터 무결성
##### 1. 데이터 베이스 오류 방지 (Transactions 적용 완료)
- **Why?** 회수 신청 시 '잠금 시간 설정'과 '신청서 작성'은 동시에 일어나야 합니다. 하나만 성공하고 하나가 실패하면 데이터가 꼬이게 됩니다.
- **How?** START TRANSACTION을 통해 신청-잠금-포인트 지급 로직을 하나의 원자적 단위로 묶어, 오류 발생 시 모든 작업을 이전 상태로 되돌리는(Rollback) 안전장치를 마련했습니다.

### 4) 로깅
##### 1. 오류 지속 수정 및 실시간 이용량 확인 (로그 파일....적용 진행중....)

### 5) 실시간 이메일 키워드 알림 (Nodemailer 적용 완료 📧)
- **Why?** 사용자가 매번 사이트에 들어와서 분실물을 확인하는 번거로움을 줄이기 위함입니다.
- **How?** 사용자가 구독한 카테고리(예: 전자기기, 지갑)의 분실물이 새로 등록되는 즉시, DB를 조회하여 해당 구독자들에게 자동으로 이메일 알림과 상세 페이지 링크를 발송합니다.

## 📂 Directory Structure
```Plaintext
tuk_alaf_server/
├── config/
│   ├── db.js            # MySQL Connection Pool
│   └── redis.js         # Redis Client Setup
├── controllers/
│   ├── authController.js    # 회원가입/로그인/이메일 인증 (Redis TTL 로직 적용)
│   ├── itemController.js    # 분실물 등록/조회 (Transaction 적용)
│   └── requestController.js # 회수 신청/승인 (Lock 로직 포함)
├── middlewares/
│   ├── authMiddleware.js    # JWT & Role(Admin) 검증
│   └── uploadMiddleware.js  # Multer 파일 처리
├── utils/
│   └── mailer.js       # Nodemailer 이메일 발송 모듈
├── routes/
│   └── apiRoutes.js    # 라우팅 통합 관리
├── uploads/            # 분실물/증빙 이미지 저장소
├── server.js           # Entry Point
└── .env                # 환경 변수 (DB, JWT, Redis, 이메일 정보 등)
```
## ☁️ Cloud Deployment (네이버 클라우드 배포 환경)
본 서버는 현재 **Naver Cloud Platform (NCP)** 환경에 배포되어 24시간 가동 중입니다.

- **OS:** Ubuntu 24.04.1 LTS
- **Server Port:** `8080` (ACG 방화벽 인바운드 개방 완료)
- **Database:** MySQL (외부망), Redis (내부망 127.0.0.1 격리)
- **Process Manager:** PM2 (무중단 운영 중)

## 🛠 Installation & Setup
### 1. 환경 설정
프로젝트를 클론하고 필요한 모듈을 설치합니다.
```Bash
mkdir TUK_ALAF_SERVER
cd TUK_ALAF_SERVER

#의존성 설치
# 기본 프레임워크, DB, 보안, 인증
npm install
```
### 2. .env 설정
```Bash
PORT= # 현재 로컬 포트 사용중
DB_HOST=localhost
DB_USER= # MySQL root 계정 name
DB_PASSWORD= # MySQL root 계정 비밀번호
DB_NAME=tuk_alaf
JWT_SECRET= # auth 코드
JWT_EXPIRES_IN= # auth 토큰 유효기간

EMAIL_USER= # 이메일 인증 전송자(구글 이메일)
MAIL_PASS= # 구글 설정에서 발급받은 16자리 앱 비밀번호
REDIS_URL= # Redis 연결 URL (예: redis://127.0.0.1:6379)

FRONTEND_URL= # 카테고리 알람시 이메일로 보내지는 내부 링크
```

### 3. 데이터베이스 세팅
아래의 SQL 스크립트를 실행하여 테이블을 생성하고 기초 데이터를 삽입합니다. (기존 테이블이 있다면 초기화되니 주의하세요)
<details> <summary>👉 <b>DB 초기화 SQL 스크립트 보기 (Click)</b></summary>
  
  ```SQL
-- 1. 외래키 체크 해제
SET FOREIGN_KEY_CHECKS = 0;

-- 2. 기존 테이블 초기화 (새로 추가될 MajorCategory 포함)
DROP TABLE IF EXISTS Comment, PostImage, Post, RetrievalRequest, Item, Notification, Member, Place, Category, MajorCategory;

-- 3. 테이블 생성

-- [1] MajorCategory (★ 신규: 대분류 테이블)
CREATE TABLE MajorCategory (
  major_category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- [2] Category (★ 개선: 기존 이름을 유지하면서 '소분류' 역할을 함)
CREATE TABLE Category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  major_category_id INT NOT NULL,             -- 대분류와 연결되는 외래키
  name VARCHAR(50) NOT NULL,
  FOREIGN KEY (major_category_id) REFERENCES MajorCategory(major_category_id) ON DELETE CASCADE
);

-- [3] Place (이름 유지, 외래키 연결을 위한 원본 유지)
CREATE TABLE Place (
  place_id INT AUTO_INCREMENT PRIMARY KEY,
  address VARCHAR(100) NOT NULL
);

-- [4] Member (login_id 유지)
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

-- [5] Notification
CREATE TABLE Notification (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  major_category_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_member_major (member_id, major_category_id),
  FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE CASCADE
);

-- [6] Item (이름 유지: name, place_id, category_id 모두 안전하게 보존됨!)
CREATE TABLE Item (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                 
  finder_id INT,                              
  place_id INT NOT NULL,                      
  detail_address VARCHAR(100),
  category_id INT NOT NULL,                   -- 소분류(Category)와 연결
  description TEXT,
  image_url VARCHAR(255),
  locker_number INT DEFAULT 1, 
  status VARCHAR(20) DEFAULT '보관중',
  found_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  locked_until DATETIME,
  is_retrieved BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  FOREIGN KEY (finder_id) REFERENCES Member(member_id) ON DELETE SET NULL,
  FOREIGN KEY (place_id) REFERENCES Place(place_id),
  FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

-- [7] RetrievalRequest
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

-- [8] Post
CREATE TABLE Post (
  post_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  member_id INT NOT NULL,
  post_type ENUM('LOST', 'LOOKING_FOR') NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image_url VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

-- [9] PostImage
CREATE TABLE PostImage (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE
);

-- [10] Comment
CREATE TABLE Comment (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  member_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE
);

-- 데이터 삽입

-- 1) 대분류 데이터 삽입 (프론트엔드 CATEGORY_DATA의 Key 값들)
INSERT INTO MajorCategory (name) VALUES 
('가방'), ('귀금속'), ('도서용품'), ('서류'), ('쇼핑백'), 
('스포츠용품'), ('악기'), ('의류'), ('자동차'), 
('전자기기'), ('지갑'), ('증명서'), ('컴퓨터'), ('카드'), 
('현금'), ('유가증권'), ('휴대폰'), ('기타물품');

-- 2) 소분류 데이터 삽입 (각각의 대분류 ID에 맞게 매핑)
INSERT INTO Category (major_category_id, name) VALUES 
(1, '여성용가방'), (1, '남성용가방'), (1, '기타가방'),
(2, '반지'), (2, '목걸이'), (2, '귀걸이'), (2, '시계'), (2, '기타 귀금속'),
(3, '학습서적'), (3, '소설'), (3, '컴퓨터서적'), (3, '만화책'), (3, '기타 서적'),
(4, '서류'), (4, '기타 서류'),
(5, '쇼핑백'),
(6, '스포츠용품'),
(7, '건반악기'), (7, '타악기'), (7, '관악기'), (7, '현악기'), (7, '기타 악기'),
(8, '여성의류'), (8, '남성의류'), (8, '아기의류'), (8, '모자'), (8, '신발'), (8, '기타 의류'),
(9, '자동차열쇠'), (9, '네비게이션'), (9, '자동차번호판'), (9, '임시번호판'), (9, '기타 자동차용품'),
(10, '태블릿'), (10, '스마트워치'), (10, '무선이어폰'), (10, '카메라'), (10, '기타 전자기기)'),
(11, '여성용지갑'), (11, '남성용지갑'), (11, '기타 지갑'),
(12, '신분증'), (12, '면허증'), (12, '여권'), (12, '기타 증명서'),
(13, '삼성노트북'), (13, 'LG노트북'), (13, '애플노트북'), (13, '기타 컴퓨터'),
(14, '신용(체크)카드'), (14, '일반카드'), (14, '교통카드'), (14, '기타 카드'),
(15, '현금'),
(16, '어음'), (16, '상품권'), (16, '채권'), (16, '기타 유가증권'),
(17, '삼성휴대폰'), (17, 'LG휴대폰'), (17, '아이폰'), (17, '기타 휴대폰'), (17, '기타 통신기기'),
(18, '기타 물품');

-- 3) 장소 (Place) 데이터
INSERT INTO Place (address) VALUES 
('A동 (기계,디자인)'), ('B동 (기계설계,메카)'), ('C동 (에너지,전기)'), ('D동 (신소재,생명화학)'), ('E동 (SW)'), ('G동 (경영)'), ('P동 (반도체)'),
('산학융합관(전자공학부)'), ('TIP (기술혁신파크)'), ('종합교육관 (중앙도서관)'), ('제2생활관'), ('행정동'), ('체육관'), ('창업보육센터'),
('시흥비즈니스센터'), ('운동장'), ('주차타워'), ('TU광장 (벙커)'), ('기타 (교내)'), ('기타 (교외)');


-- 4) 계정 
-- auth로 인하여 회원가입을 따로 하셔야 합니다.
-- 요청시 클라우드 서버 관리자가 ADMIN 변경해드립니다.

-- 5) 아이템 (Category의 ID 중 하나를 참조)
-- 더미 데이터 대신 실제 상황 테스트용 데이터를 넣을 예정입니다.

-- 4. 외래키 체크 다시 켜기
SET FOREIGN_KEY_CHECKS = 1;

-- 5. 변경사항 최종 반영
COMMIT;
```
</details>

## ✅ API Test Status
- **Base URL (Local):** `http://localhost:8080/api`
- **Base URL (Production):** `http://[NCP_공인_IP]:8080/api`

현재 구현 및 클라우드 배포가 완료된 API 목록입니다.

| Method | Endpoint | Description | Status | Note |
| :--- | :--- | :--- | :---: | :--- |
| **POST** | `/api/auth/send-code` | 학교 이메일 인증번호 발송 | ✅ 완료 | Nodemailer 연동 (인증 메일 전송) |
| **POST** | `/api/auth/verify-code` | 이메일 인증번호 확인 | ✅ 완료 | 발송된 코드와 대조 검증 |
| **POST** | `/api/auth/register` | 회원가입 | ✅ 완료 | 비밀번호 Bcrypt 암호화 저장 |
| **POST** | `/api/auth/login` | 로그인 (JWT 발급) | ✅ 완료 | 엑세스 토큰 반환 |
| **GET** | `/api/items` | 분실물 목록 조회 | ✅ 완료 | `found_date` 최신순 정렬, `category` 필터 |
| **POST** | `/api/items` | 분실물 등록 | ✅ 완료 | **등록 시 구독자에게 자동 이메일 발송** (이미지 업로드) |
| **GET** | `/api/items/:id` | 분실물 상세 조회 | ✅ 완료 | 잠금 상태 및 남은 시간 표시 |
| **DELETE**| `/api/items/:id` | 분실물 삭제 | ✅ 완료 | **관리자 권한(`isAdmin`) 필수** |
| **POST** | `/api/requests` | 회수 신청 (48시간 선점) | ✅ 완료 | **트랜잭션 적용**, 증빙 이미지 업로드, 48시간 잠금 |
| **GET** | `/api/admin/requests` | 관리자 - 미처리 신청 목록 | ✅ 완료 | 관리자 권한(`isAdmin`) 필수 |
| **POST** | `/api/admin/requests/:id/process`| 관리자 - 승인/거절 처리 | ✅ 완료 | 거절 시 즉시 잠금 해제(Lock Reset) |
| **GET** | `/api/alerts` | 사용자 알림 설정 조회 | ✅ 완료 | 내 이메일 알림(구독) 카테고리 목록 로드 |
| **POST** | `/api/alerts` | 사용자 알림 설정 업데이트 | ✅ 완료 | 알림 받을 카테고리 DB 갱신 |
| **GET** | `/api/kiosk/approved` | [키오스크] 승인된 회수 목록 | ✅ 완료 | 회수 승인된 본인 물건 목록 (잠금장치 오픈 대기) |
| **POST** | `/api/kiosk/requests/:id/complete`| [키오스크] 회수 완료 처리 | ✅ 완료 | 보관함 문 열림 및 `is_retrieved` 상태 업데이트 |

## 📝 TODO (Roadmap)
- [x] 관리자 승인 API: 웹 관리자 페이지에서 회수 요청을 승인/거절하는 로직 및 트랜잭션 구현
- [x] 48시간 회수 신청 잠금(Lock): 동시 신청 방지 및 비즈니스 로직 고도화
- [x] 이메일 인증 API: 회원가입 시 학교 이메일(@tuk.ac.kr) 인증 로직 연동
- [x] 실시간 알림 서비스: 관심 카테고리 물건 등록 시 이메일 알림(Push) 발송
- [x] 클라우드 서버 보안: ACG화이트리스트,SSHKey기반,Fail2Ban적용
- [x] 네이버 클라우드(NCP) 우분투 서버 구축 및 MySQL 연동 완료!
- [x] PM2를 활용한 백엔드 API 서버 24시간 무중단 배포 완료!
- [x] 커뮤니티(게시판) 기능: 보관함 외 직접 전달 물건을 위한 글쓰기 및 댓글 기능
- [x] 조회수 추가
- [x] 내부망 DB Redis 추가
- [ ] 채팅 시스템 추가
- [ ] 통계 시스템 추가
- [ ] 운영 보안 강화: CORS 설정, Rate Limiting(요청 횟수 제한), HTTPS 적용
