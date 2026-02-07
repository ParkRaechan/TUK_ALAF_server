// src/ui/web/WebMyPage.jsx
import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import WebLogin from './WebLogin'; // 로그인 안 했을 때 보여줄 컴포넌트

const WebMyPage = () => {
  // -----------------------------------------------------------
  // 1. Context에서 유저 정보 가져오기
  // user: 로그인한 사용자 정보 객체 (없으면 null)
  // logout: 로그아웃 함수
  // -----------------------------------------------------------
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  // -----------------------------------------------------------
  // 2. 비로그인 사용자 차단
  // 유저 정보가 없으면 마이페이지 대신 '로그인 화면'을 보여줍니다.
  // (따로 리다이렉트할 필요 없이 컴포넌트 자체를 교체하는 방식)
  // -----------------------------------------------------------
  if (!user) {
    return <WebLogin />;
  }

  // -----------------------------------------------------------
  // 3. 로그인 사용자에게만 보이는 마이페이지 화면
  // -----------------------------------------------------------
  return (
    <div className="pc-container">
      
      {/* 상단 헤더 (메인으로 돌아가기) */}
      <header className="pc-header" style={{ justifyContent: 'flex-start' }}>
        <div className="header-inner">
           <button 
             onClick={() => navigate('/')} 
             style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontWeight:'bold', border:'none', background:'none' }}
           >
             <ArrowLeft size={24} /> 메인으로
           </button>
        </div>
      </header>

      <main className="pc-main">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 30, fontSize: 28, fontWeight: 'bold' }}>마이페이지</h2>

            {/* 프로필 정보 카드 */}
            <div style={{ background: 'white', padding: 40, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 30 }}>
                
                {/* 프로필 아이콘 (이미지 대신 아이콘 사용) */}
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={50} color="#adb5bd" />
                </div>
                
                {/* 텍스트 정보 (Context에서 가져온 user 데이터 표시) */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 24, marginBottom: 5 }}>{user.name} 님</h3>
                    <p style={{ color: '#666', fontSize: 16 }}>{user.department} ({user.studentId})</p>
                    <p style={{ color: '#888', fontSize: 14, marginTop: 5 }}>ID: {user.userId}</p>
                </div>
                
                {/* 로그아웃 버튼 */}
                <button 
                    onClick={logout}
                    style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8, color: '#fa5252', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', background:'white' }}
                >
                    <LogOut size={16} /> 로그아웃
                </button>
            </div>

            {/* 활동 내역 섹션 (추후 데이터 연동 필요) */}
            <div style={{ marginTop: 30 }}>
                <h3>내가 등록한 분실물</h3>
                <div style={{ background: 'white', padding: 40, borderRadius: 16, marginTop: 15, color: '#bbb', textAlign: 'center', border: '1px dashed #ddd' }}>
                    등록된 내역이 없습니다.
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default WebMyPage;