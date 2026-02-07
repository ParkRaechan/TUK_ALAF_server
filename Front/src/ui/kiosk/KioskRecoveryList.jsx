import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ItemContext } from '../../context/ItemContext';
import { ArrowLeft, Box } from 'lucide-react';

const KioskRecoveryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 전체 물건 리스트 가져오기 (Context 사용)
  const { items } = useContext(ItemContext);
  
  // 로그인 화면에서 넘겨준 아이디 받기 (없으면 'Guest')
  const userId = location.state?.userId || 'Guest';

  // -----------------------------------------------------------
  // [필터링 로직] 회수 가능한 물건 목록 만들기
  // -----------------------------------------------------------
  // ★ [UX 테스트용 임시 코드] 
  // 백엔드 연동 전이라, 현재 '보관중'인 모든 물건을 다 보여줍니다.
  // (나중에는 items.filter(item => item.requesterId === userId) 로 수정해야 함)
  const myItems = items.filter(item => item.status === '보관중');

  // -----------------------------------------------------------
  // [물건 선택 핸들러]
  // 클릭 시 '회수용 보관함 열림' 화면으로 이동
  // -----------------------------------------------------------
  const handleSelect = (item) => {
    // 선택한 물건 정보를 state에 담아서 다음 화면으로 보냄
    navigate('/kiosk/retrieval-locker', { state: item });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
      
      {/* 1. 상단 헤더 */}
      <div style={{ padding: '15px', background: 'white', display: 'flex', alignItems: 'center', height: 60, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate('/kiosk')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={30} color="#333" />
        </button>
        <h1 style={{ marginLeft: 15, fontSize: 20, margin: '0 0 0 15px' }}>
          <span style={{color:'#4834d4'}}>{userId}</span>님의 신청 목록
        </h1>
      </div>

      {/* 2. 리스트 영역 (스크롤 가능) */}
      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        
        {/* 물건이 없을 때 보여줄 화면 */}
        {myItems.length === 0 ? (
          <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#aaa' }}>
            <Box size={50} style={{marginBottom:10}} />
            <p>회수할 물건이 없습니다.</p>
          </div>
        ) : (
          // 물건이 있을 때: 2열 그리드(Grid) 레이아웃
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {myItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{ 
                  background: 'white', borderRadius: 20, padding: 15, 
                  border: '1px solid #eee', cursor: 'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:15,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                  transition: 'transform 0.1s'
                }}
                // 터치 시 살짝 눌리는 효과
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* (1) 이미지 영역 (정사각형 비율 유지) */}
                <div style={{ width:'100%', aspectRatio:'1/1', background:'#f1f2f6', borderRadius:15, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                   {item.image ? (
                     <img src={item.image} alt={item.title} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                   ) : (
                     <span style={{color:'#ccc'}}>No Image</span>
                   )}
                </div>
                
                {/* (2) 이름 영역 (긴 이름은 ... 처리) */}
                <div style={{fontSize: 20, fontWeight:'bold', textAlign:'center', color:'#2c3e50', width:'100%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskRecoveryList;