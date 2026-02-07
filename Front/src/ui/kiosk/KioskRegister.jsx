import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';

const KioskRegister = () => {
  const navigate = useNavigate();

  // -----------------------------------------------------------
  // 1. 입력값 상태 관리
  // 여기서는 텍스트 정보만 입력받고, 사진은 다음 화면에서 찍습니다.
  // -----------------------------------------------------------
  const [inputs, setInputs] = useState({
    category: '전자기기',
    title: '',
    date: new Date().toISOString().split('T')[0], // 기본값: 오늘 날짜
    location: '',
    desc: '',
    userId: '' // (선택사항) 포인트 적립용 회원 ID
  });

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  // -----------------------------------------------------------
  // 2. [다음 단계 이동] '촬영 화면'으로 데이터 넘기기
  // -----------------------------------------------------------
  const handleToCapture = () => {
    // 필수 입력 체크 (제목, 장소 없으면 안 넘어감)
    if (!inputs.title || !inputs.location) {
      alert("물건 이름과 장소는 필수입니다!");
      return;
    }
    
    // ★ 핵심: 지금까지 입력한 데이터(inputs)를 state에 담아서 
    // '/kiosk/capture' 페이지로 전달합니다. (새로고침 없이 데이터 유지)
    navigate('/kiosk/capture', { state: inputs });
  };

  // -----------------------------------------------------------
  // [스타일] 7인치 화면에 맞춘 컴팩트 스타일
  // -----------------------------------------------------------
  const labelStyle = { display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#333' };
  const inputStyle = { 
    padding: '8px 10px', fontSize: 14, borderRadius: 8, 
    border: '1px solid #ccc', width: '100%', marginBottom: 10, boxSizing:'border-box' 
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      
      {/* 상단 헤더 (뒤로가기) */}
      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', height: 50, boxSizing:'border-box' }}>
        <button onClick={() => navigate('/kiosk')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={{ marginLeft: 10, fontSize: 18, margin: '0 0 0 10px' }}>정보 입력 (1/2)</h1>
      </div>

      {/* 입력 폼 영역 
        - overflowY: 'auto' 속성 덕분에 키보드가 올라와도 스크롤 가능함
      */}
      <div style={{ flex: 1, padding: 15, overflowY: 'auto', background: '#f8f9fa' }}>
        
        {/* 카테고리 & 날짜 (한 줄에 배치) */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>카테고리</label>
            <select name="category" value={inputs.category} onChange={handleChange} style={inputStyle}>
              <option>전자기기</option><option>지갑/카드</option><option>가방</option><option>의류</option><option>기타</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>습득일</label>
            <input type="date" name="date" value={inputs.date} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* 기본 정보 입력 */}
        <label style={labelStyle}>물건 이름</label>
        <input name="title" placeholder="예: 아이폰 15" value={inputs.title} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>장소</label>
        <input name="location" placeholder="예: 304호" value={inputs.location} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>특징</label>
        <textarea 
            name="desc" placeholder="특징 입력" value={inputs.desc} onChange={handleChange} 
            style={{ ...inputStyle, height: 60, resize: 'none' }} 
        />

        {/* 포인트 적립 안내 (선택사항) */}
        <div style={{ background: '#e1f5fe', padding: 10, borderRadius: 8, marginBottom: 15 }}>
          <label style={{ ...labelStyle, color: '#0277bd', marginBottom:2 }}>ID (포인트 적립)</label>
          <input name="userId" placeholder="선택사항" value={inputs.userId} onChange={handleChange} style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        {/* 다음 단계 버튼 (카메라 아이콘) */}
        <button 
          onClick={handleToCapture}
          style={{ 
              width: '100%', padding: 15, background: '#2c3e50', color: 'white', 
              fontSize: 18, fontWeight: 'bold', borderRadius: 10, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}
        >
          <Camera size={24} /> 이미지 촬영하러 가기
        </button>
      </div>
    </div>
  );
};

export default KioskRegister;