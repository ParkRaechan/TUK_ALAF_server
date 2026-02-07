import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// -----------------------------------------------------------
// [1] 페이지 컴포넌트 불러오기
// -----------------------------------------------------------
// (1) 일반 웹(PC/Mobile)용 페이지
import WebHome from './ui/web/WebHome';
import WebDetail from './ui/web/WebDetail';
import WebRegister from './ui/web/WebRegister';
import WebMyPage from './ui/web/WebMyPage';
import WebSignup from './ui/web/WebSignup';

// (2) 키오스크(Raspberry Pi)용 페이지
import KioskHome from './ui/kiosk/KioskHome';
import KioskRegister from './ui/kiosk/KioskRegister';
import KioskCapture from './ui/kiosk/KioskCapture';
import KioskLocker from './ui/kiosk/KioskLocker';
import KioskConfirm from './ui/kiosk/KioskConfirm';
import KioskLogin from './ui/kiosk/KioskLogin';
import KioskRecoveryList from './ui/kiosk/KioskRecoveryList';
import KioskRetrievalLocker from './ui/kiosk/KioskRetrievalLocker';

// -----------------------------------------------------------
// [2] Context (데이터 공급소) 불러오기
// -----------------------------------------------------------
import { ItemProvider } from './context/ItemContext'; // 분실물 데이터
import { UserProvider } from './context/UserContext'; // 유저 로그인 정보

import './App.css';

function App() {
  return (
    // -----------------------------------------------------------
    // [3] Provider 감싸기 (전역 상태 관리)
    // 앱 전체에서 로그인 정보(User)와 물건 정보(Item)를 쓸 수 있도록 감싸줍니다.
    // -----------------------------------------------------------
    <UserProvider>
      <ItemProvider>
        
        {/* [4] 라우터 설정 (주소별 화면 연결) */}
        <BrowserRouter>
          <Routes>
            
            {/* =======================================================
                [Section A] 일반 웹 페이지 라우팅
                (PC나 스마트폰으로 접속했을 때 보여줄 화면들)
               ======================================================= */}
            <Route path="/" element={<WebHome />} />          {/* 메인 화면 */}
            <Route path="/detail/:id" element={<WebDetail />} /> {/* 상세 페이지 (ex: /detail/1) */}
            <Route path="/register" element={<WebRegister />} /> {/* 등록 페이지 */}
            <Route path="/mypage" element={<WebMyPage />} />     {/* 마이 페이지 */}
            <Route path="/signup" element={<WebSignup />} />     {/* 회원가입 페이지 */}


            {/* =======================================================
                [Section B] 키오스크 전용 라우팅
                (라즈베리파이 터치스크린에서 보여줄 화면들 - '/kiosk'로 시작)
               ======================================================= */}
            <Route path="/kiosk" element={<KioskHome />} /> {/* 키오스크 메인 */}
            
            {/* --- 등록 절차 --- */}
            <Route path="/kiosk/register" element={<KioskRegister />} /> {/* 1. 정보 입력 */}
            <Route path="/kiosk/capture" element={<KioskCapture />} />   {/* 2. 사진 촬영 */}
            <Route path="/kiosk/locker" element={<KioskLocker />} />     {/* 3. 보관함 열림 */}
            <Route path="/kiosk/confirm" element={<KioskConfirm />} />   {/* 4. 완료 확인 */}
            
            {/* --- 회수 절차 --- */}
            <Route path="/kiosk/login" element={<KioskLogin />} />       {/* 1. 로그인 */}
            <Route path="/kiosk/recovery" element={<KioskRecoveryList />} /> {/* 2. 목록 선택 */}
            <Route path="/kiosk/retrieval-locker" element={<KioskRetrievalLocker />} /> {/* 3. 회수함 열림 */}

          </Routes>
        </BrowserRouter>

      </ItemProvider>
   </UserProvider>
  );
}

export default App;