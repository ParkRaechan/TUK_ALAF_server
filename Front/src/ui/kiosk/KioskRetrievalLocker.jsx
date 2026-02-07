import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Unlock, Lock, LogOut } from 'lucide-react';

const KioskRetrievalLocker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // -----------------------------------------------------------
  // 1. 데이터 수신
  // 목록 화면에서 선택한 '찾을 물건' 정보를 받아옵니다.
  // -----------------------------------------------------------
  const item = location.state; 

  // 타이머 상태 (30초)
  const [count, setCount] = useState(30);

  // -----------------------------------------------------------
  // 2. [카운트다운 로직]
  // -----------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        // 시간이 다 되면 (0초 근접)
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(); // 시간 초과 시 자동 완료 처리
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 컴포넌트가 꺼질 때 타이머 정리 (메모리 누수 방지)
    return () => clearInterval(timer);
  }, []);

  // -----------------------------------------------------------
  // 3. [완료 처리 함수]
  // 버튼을 누르거나 시간이 다 되면 실행
  // -----------------------------------------------------------
  const handleFinish = () => {
    // [UX] 회수 완료 메시지
    alert("회수가 완료되었습니다. 안녕히 가세요!");
    
    // 키오스크 첫 화면(메인)으로 복귀
    navigate('/kiosk'); 
  };

  // 데이터가 없으면 아무것도 렌더링 안 함
  if (!item) return null;

  return (
    // [스타일] 회수 모드는 '파란색(#4834d4)' 배경을 써서 등록 모드와 구분함
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#4834d4', color: 'white', padding: 20, boxSizing: 'border-box' }}>
      
      {/* 상단 아이콘 (열림) */}
      <div style={{ marginBottom: 20, padding: 30, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
        <Unlock size={80} color="#a29bfe" />
      </div>

      <h1 style={{ fontSize: 32, margin: 0, fontWeight: 'bold' }}>보관함이 열렸습니다!</h1>
      
      {/* ★ 회수 안내 멘트 (물건 이름 강조) */}
      <p style={{ fontSize: 20, marginTop: 15, color: '#d1d8e0', textAlign:'center' }}>
        물건(<b style={{color:'white'}}>{item.title}</b>)을 <b>꺼내고</b><br/>
        문을 닫아주세요.
      </p>

      {/* 카운트다운 타이머 */}
      <div style={{ margin: '30px 0', fontSize: 80, fontWeight: 'bold', fontFamily: 'monospace', color: '#ffeb3b' }}>
        {count}
      </div>

      <p style={{ fontSize: 16, color: '#d1d8e0', marginBottom: 40 }}>
        초 후 자동으로 닫힙니다.
      </p>

      {/* 회수 완료 버튼 */}
      <button 
        onClick={handleFinish}
        style={{ 
          padding: '20px 60px', 
          background: 'white', 
          color: '#4834d4', 
          fontSize: 24, 
          fontWeight: 'bold', 
          borderRadius: 50, 
          border: 'none', 
          cursor: 'pointer',
          display: 'flex', 
          alignItems: 'center', 
          gap: 15,
          boxShadow: '0 5px 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        <LogOut size={30} />
        회수 완료
      </button>

    </div>
  );
};

export default KioskRetrievalLocker;