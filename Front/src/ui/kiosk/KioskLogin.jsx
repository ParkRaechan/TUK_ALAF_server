import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, LogIn } from 'lucide-react';

// 키오스크 전용 로그인 화면 (분실물 회수용)
const KioskLogin = () => {
  const navigate = useNavigate();
  
  // [나중에 할 일] 실제 로그인 연동 시 아래 주석 해제 필요
  // const { login } = useContext(UserContext); 

  // 입력받은 아이디/비번 저장
  const [inputs, setInputs] = useState({ id: '', pw: '' });

  // 입력창 값 변경 핸들러
  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  // -----------------------------------------------------------
  // [로그인 처리 함수] (현재는 테스트용 임시 로직)
  // -----------------------------------------------------------
  const handleLogin = async () => {
    // 1. 유효성 검사 (빈칸 체크)
    if (!inputs.id || !inputs.pw) {
      return alert("아이디와 비밀번호를 입력해주세요.");
    }

    // 2. ★ [임시 수정] 무조건 로그인 성공 처리!
    // 백엔드 연동 전이라, 아이디만 입력하면 통과시킵니다.
    // (원래는 여기서 await login(inputs.id, inputs.pw)를 호출해야 함)
    
    // 3. 다음 화면(회수 목록)으로 이동
    // "누구님 환영합니다"를 보여주기 위해 입력한 ID를 state로 넘겨줍니다.
    navigate('/kiosk/recovery', { state: { userId: inputs.id } });
  };

  // -----------------------------------------------------------
  // [스타일 정의] 7인치 터치스크린에 맞춰 큼직하게 설정
  // -----------------------------------------------------------
  const inputContainerStyle = {
    display: 'flex', alignItems: 'center', background: '#f1f2f6',
    borderRadius: 15, padding: '15px 20px', marginBottom: 20,
    border: '2px solid transparent'
  };
  const inputStyle = {
    border: 'none', background: 'transparent', fontSize: 22,
    marginLeft: 15, width: '100%', outline: 'none'
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      
      {/* 상단 헤더 (뒤로가기) */}
      <div style={{ padding: '15px', display: 'flex', alignItems: 'center', height: 60, boxSizing: 'border-box' }}>
        <button onClick={() => navigate('/kiosk')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={30} color="#333" />
        </button>
        <h1 style={{ marginLeft: 15, fontSize: 24, margin: '0 0 0 15px' }}>분실물 회수 로그인</h1>
      </div>

      {/* 로그인 폼 영역 */}
      <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* 아이디 입력칸 */}
        <div style={inputContainerStyle}>
          <User size={30} color="#a4b0be" />
          <input 
            name="id" 
            placeholder="아이디 (아무거나 입력)" 
            value={inputs.id} 
            onChange={handleChange} 
            style={inputStyle} 
          />
        </div>

        {/* 비밀번호 입력칸 */}
        <div style={inputContainerStyle}>
          <Lock size={30} color="#a4b0be" />
          <input 
            type="password" 
            name="pw" 
            placeholder="비밀번호 (아무거나 입력)" 
            value={inputs.pw} 
            onChange={handleChange} 
            style={inputStyle} 
          />
        </div>

        {/* 로그인 버튼 (임시 통과 버튼) */}
        <button 
          onClick={handleLogin}
          style={{
            marginTop: 20, padding: 20, background: '#4834d4', color: 'white',
            fontSize: 24, fontWeight: 'bold', borderRadius: 15, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer', boxShadow: '0 5px 15px rgba(72, 52, 212, 0.3)'
          }}
        >
          <LogIn size={28} /> 로그인하기 (임시 통과)
        </button>

      </div>
    </div>
  );
};

export default KioskLogin;