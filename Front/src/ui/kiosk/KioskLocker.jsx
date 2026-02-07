import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Unlock, Lock, Check } from 'lucide-react';

const KioskLocker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // -----------------------------------------------------------
  // 1. 데이터 수신
  // 이전 화면(촬영)에서 넘겨준 등록 정보(이미지 포함)를 잠시 데리고 있습니다.
  // -----------------------------------------------------------
  const data = location.state; 

  // 타이머 상태 관리 (기본 30초)
  const [count, setCount] = useState(30); 

  // -----------------------------------------------------------
  // 2. [카운트다운 로직] 컴포넌트가 켜지자마자 시작
  // -----------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        // 시간이 다 되면 (1초 이하로 떨어지면)
        if (prev <= 1) {
          clearInterval(timer); // 타이머 멈춤
          handleCloseLocker();  // 자동 잠금 함수 실행
          return 0;
        }
        return prev - 1; // 1초씩 감소
      });
    }, 1000); // 1000ms = 1초

    // 화면을 나갈 때 타이머 정리 (메모리 누수 방지)
    return () => clearInterval(timer);
  }, []);

  // -----------------------------------------------------------
  // 3. [잠금 및 이동 함수]
  // 시간이 다 되거나, 사용자가 '보관 완료' 버튼을 눌렀을 때 실행
  // -----------------------------------------------------------
  const handleCloseLocker = () => {
    // [UX] 사용자에게 명확히 알림 (추후 토스트 메시지로 변경 가능)
    alert("보관함이 잠겼습니다."); 
    
    // 다음 화면(최종 확인 페이지)으로 데이터와 함께 이동
    navigate('/kiosk/confirm', { state: data });
  };

  // 데이터가 없으면 렌더링 안 함 (에러 방지)
  if (!data) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#2c3e50', color: 'white', padding: 20, boxSizing: 'border-box' }}>
      
      {/* 상단 아이콘 (열림 표시) */}
      <div style={{ marginBottom: 30, padding: 30, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
        <Unlock size={80} color="#2ecc71" />
      </div>

      <h1 style={{ fontSize: 36, margin: 0, fontWeight: 'bold' }}>보관함이 열렸습니다!</h1>
      <p style={{ fontSize: 20, marginTop: 10, color: '#bdc3c7' }}>
        물건을 넣고 문을 닫아주세요.
      </p>

      {/* 중앙 카운트다운 타이머 */}
      <div style={{ margin: '40px 0', fontSize: 80, fontWeight: 'bold', fontFamily: 'monospace', color: '#f1c40f' }}>
        {count}
      </div>

      <p style={{ fontSize: 18, color: '#ecf0f1', marginBottom: 40 }}>
        초 후 자동으로 잠깁니다.
      </p>

      {/* 하단 버튼 (즉시 잠금) */}
      <button 
        onClick={handleCloseLocker}
        style={{ 
          padding: '20px 50px', 
          background: '#2ecc71', // 초록색 버튼
          color: 'white', 
          fontSize: 24, 
          fontWeight: 'bold', 
          borderRadius: 50, 
          border: 'none', 
          cursor: 'pointer',
          display: 'flex', 
          alignItems: 'center', 
          gap: 15,
          boxShadow: '0 5px 20px rgba(46, 204, 113, 0.4)'
        }}
      >
        <Lock size={30} />
        보관 완료 (즉시 잠금)
      </button>

    </div>
  );
};

export default KioskLocker;