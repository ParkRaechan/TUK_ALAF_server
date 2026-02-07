# 🎨 ALAF Client (Frontend)

> **대학 분실물 통합 관리 시스템 - 웹 & 키오스크 인터페이스**

이 디렉토리는 ALAF 프로젝트의 **프론트엔드(React)** 소스 코드를 담고 있습니다.  
사용자 경험(UX) 중심의 웹(Web) 화면과 라즈베리파이 키오스크(Kiosk) 화면을 모두 포함하고 있습니다.

---

## 🚧 개발 진행 상황 (Current Status)

**현재 단계: 프로토타입 & UX 로직 구현 (Prototype Phase)**

현재 버전은 **기능적인 흐름(Flow)과 데이터 로직**을 검증하는 단계입니다. 아래 사항을 꼭 참고해 주세요.

1.  **UX Flow 중심**: 사용자가 물건을 등록하고 회수하는 논리적 절차는 대부분 구현되어 있습니다.
2.  **UI Design**: 현재 레이아웃은 기능 테스트를 위한 기본 스타일입니다. **최종 디자인(CSS) 작업은 기능 확정 후 일괄 진행**할 예정입니다.
3.  **Server Integration**: 백엔드 API와의 연동을 위해 `axios`가 설정되어 있으나, 실제 서버 주소 및 응답 포맷에 맞춰 **추가적인 수정이 필요**합니다. (`src/context/ItemContext.js` 참고)

---

## 📂 프로젝트 구조 (Structure)

```bash
src/
├── context/             # ⚡️ 전역 상태 관리 (데이터 공급소)
│   ├── ItemContext.js   # 분실물 데이터 CRUD 및 API 호출 로직
│   └── UserContext.js   # 유저 로그인/인증 로직 (현재 Mock Data)
│
├── ui/                  # 🖼️ 화면 컴포넌트
│   ├── web/             # [PC/Mobile] 일반 웹 브라우저용 페이지
│   │   ├── WebHome.jsx      # 메인: 검색, 카테고리 필터
│   │   ├── WebRegister.jsx  # 등록: 정보 입력 및 이미지 업로드
│   │   └── ...
│   │
│   └── kiosk/           # [Raspberry Pi] 터치스크린 키오스크용 페이지
│       ├── KioskHome.jsx    # 대기 화면
│       ├── KioskCapture.jsx # 웹캠 연동 및 촬영
│       ├── KioskLocker.jsx  # 보관함 제어 시뮬레이션
│       └── ...
│
├── App.js               # 🚦 라우팅 설정 (Web vs Kiosk 경로 분리)
└── App.css              # 🎨 전역 스타일 초기화 (Reset CSS)
