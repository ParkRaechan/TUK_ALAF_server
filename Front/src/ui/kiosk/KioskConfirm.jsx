import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';

const KioskConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // -----------------------------------------------------------
  // 1. 데이터 수신
  // 이전 화면(보관함/촬영화면)에서 넘겨준 { title, image, ... } 정보를 받습니다.
  // -----------------------------------------------------------
  const data = location.state;

  // [예외 처리] 데이터 없이 주소로 바로 들어왔을 경우 방어 코드
  if (!data) return <div style={{padding:20}}>정보가 없습니다.</div>;

  return (
    <div style={{ height: '100vh', padding: 20, background: 'white', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {/* 2. 상단 성공 메시지 */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#2ecc71', marginBottom:10 }}>
          <CheckCircle size={40} />
          <h1 style={{ fontSize: 28, margin: 0 }}>등록이 완료되었습니다</h1>
        </div>
        <p style={{ fontSize: 16, color: '#7f8c8d', margin:0 }}>
          보관함에 물건을 넣고 문을 닫아주세요.
        </p>
      </div>

      {/* 3. 정보 확인 카드 (회색 박스) */}
      <div style={{ flex: 1, display: 'flex', gap: 20, background: '#f8f9fa', borderRadius: 15, padding: 15, border: '1px solid #eee', overflow: 'hidden' }}>
        
        {/* [왼쪽] 이미지 영역 (검은 배경) */}
        <div style={{ flex: '0 0 40%', display: 'flex', alignItems: 'center', justifyContent: 'center', background:'black', borderRadius:10, overflow:'hidden' }}>
          {data.imageUrl ? (
            <img src={data.imageUrl} alt="등록물건" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{color:'white'}}>이미지 없음</span>
          )}
        </div>

        {/* [오른쪽] 텍스트 정보 영역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <div>
            {/* 카테고리 태그 */}
            <span style={{ fontSize: 12, background: '#e9ecef', padding: '4px 8px', borderRadius: 5, color: '#495057' }}>
              {data.category}
            </span>
            {/* 물건 이름 */}
            <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 5, color:'#2c3e50' }}>{data.title}</div>
          </div>
          
          {/* 날짜 및 장소 */}
          <div style={{ fontSize: 16, color:'#555' }}>
            <div><b>습득일:</b> {data.date}</div>
            <div><b>장소:</b> {data.location}</div>
          </div>
          
          {/* 상세 설명 (스크롤 가능) */}
          <div style={{ fontSize: 14, color:'#777', background:'white', padding:10, borderRadius:8, flex:1, overflowY:'auto' }}>
            {data.desc}
          </div>
        </div>
      </div>

      {/* 4. 홈으로 돌아가기 버튼 */}
      <button 
        onClick={() => navigate('/kiosk')}
        style={{ 
          marginTop: 20, padding: 15, background: '#2c3e50', color: 'white', 
          fontSize: 20, fontWeight: 'bold', borderRadius: 15, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}
      >
        <Home size={24} /> 처음으로 돌아가기
      </button>

    </div>
  );
};

export default KioskConfirm;