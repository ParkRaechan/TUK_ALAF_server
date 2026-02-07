import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search } from 'lucide-react'; // 아이콘 라이브러리 (lucide-react)

const KioskHome = () => {
  // 페이지 이동을 위한 훅 (Link 태그 대신 사용)
  const navigate = useNavigate();

  // -----------------------------------------------------------
  // [공통 스타일] 버튼 2개가 똑같이 생겨서 변수로 뺐습니다.
  // -----------------------------------------------------------
  const buttonStyle = {
    flex: 1, // 화면 반반 차지하기
    margin: '10px', 
    borderRadius: 20, 
    border: 'none',
    fontSize: 28, // 설명 문구가 없어져서 글씨를 키움
    fontWeight: 'bold', 
    color: 'white',
    display: 'flex', 
    flexDirection: 'column', // 아이콘 위, 글자 아래 배치
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 15, // 아이콘과 글자 사이 간격
    cursor: 'pointer', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)', // 살짝 뜬 느낌 (그림자)
    transition: 'transform 0.1s' // 클릭 시 눌리는 효과용
  };

  return (
    // 전체 화면 컨테이너 (flex-column)
    <div style={{ height: '100vh', padding: 15, display: 'flex', flexDirection: 'column', background: '#f8f9fa', boxSizing: 'border-box' }}>
      
      {/* 1. 상단 헤더 (로고 영역) */}
      <header style={{ textAlign: 'center', marginBottom: 15, flexShrink: 0 }}>
        <h1 style={{ fontSize: 28, color: '#2c3e50', margin: 0 }}>ALAF KIOSK</h1>
      </header>

      {/* 2. 메인 버튼 영역 (가로 배치) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        
        {/* [왼쪽 버튼] 분실물 등록 */}
        <button 
          onClick={() => navigate('/kiosk/register')} // 클릭 시 등록 화면으로 이동
          style={{ ...buttonStyle, background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)' }} // 붉은색 그라데이션
        >
          <Upload size={60} />
          <div>분실물 등록</div>
        </button>

        {/* [오른쪽 버튼] 분실물 회수 */}
        <button 
          onClick={() => navigate('/kiosk/login')} // 클릭 시 로그인 화면으로 이동 (회수 절차 시작)
          style={{ ...buttonStyle, background: 'linear-gradient(135deg, #4834d4 0%, #686de0 100%)' }} // 파란색 그라데이션
        >
          <Search size={60} />
          <div>분실물 회수</div>
        </button>

      </div>
    </div>
  );
};

export default KioskHome;