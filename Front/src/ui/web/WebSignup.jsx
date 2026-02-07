import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, X } from 'lucide-react';

const WebSignup = () => {
  const navigate = useNavigate();

  // -----------------------------------------------------------
  // 1. [상태 관리] 단계 및 입력값
  // Step 1: 정보 입력 -> (약관 모달) -> Step 2: 인증번호 입력
  // -----------------------------------------------------------
  const [step, setStep] = useState(1);
  const [showTerms, setShowTerms] = useState(false); // 약관 모달 표시 여부

  // 입력값 통합 관리
  const [inputs, setInputs] = useState({
    id: '', pw: '', name: '', 
    rrnFront: '', gender: '', // 주민번호 앞자리, 뒷자리 첫글자
    carrier: '', phone: ''
  });

  // 유효성 검사 상태 (touched: 한번이라도 클릭했는지, isValid: 전체 통과 여부)
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  // 인증번호 타이머 관련
  const [verifyCode, setVerifyCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3분 (180초)

  // 약관 동의 상태
  const [agreements, setAgreements] = useState({
    all: false, term1: false, term2: false, term3: false, term4: false, term5: false,
  });

  // -----------------------------------------------------------
  // 2. [타이머 로직] Step 2 진입 시 자동 실행
  // -----------------------------------------------------------
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
    }
    return () => clearInterval(timer); // 컴포넌트 언마운트 시 타이머 정리
  }, [step, timeLeft]);

  // 시간 포맷 (180 -> 03:00)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // -----------------------------------------------------------
  // 3. [입력 핸들러] & [실시간 유효성 검사]
  // -----------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  // 입력값이 변할 때마다 유효성 체크 (Step 1 버튼 활성화용)
  useEffect(() => {
    if (step === 1) {
      const isValid = 
        inputs.id.length > 0 &&
        inputs.pw.length > 0 &&
        inputs.name.length > 0 &&
        inputs.rrnFront.length === 6 &&
        inputs.gender.length === 1 &&
        inputs.carrier !== '' &&
        inputs.phone.length >= 10;
      setIsFormValid(isValid);
    }
  }, [inputs, step]);

  // -----------------------------------------------------------
  // 4. [약관 동의 로직]
  // -----------------------------------------------------------
  // 전체 동의 클릭 시
  const handleAllCheck = () => {
    const newValue = !agreements.all;
    setAgreements({ all: newValue, term1: newValue, term2: newValue, term3: newValue, term4: newValue, term5: newValue });
  };

  // 개별 동의 클릭 시 (모두 체크되면 전체 동의도 자동 체크)
  const handleSingleCheck = (key) => {
    const newState = { ...agreements, [key]: !agreements[key] };
    const allChecked = newState.term1 && newState.term2 && newState.term3 && newState.term4 && newState.term5;
    newState.all = allChecked;
    setAgreements(newState);
  };

  // -----------------------------------------------------------
  // 5. [단계 이동 핸들러]
  // -----------------------------------------------------------
  // Step 1 완료 -> 약관 모달 열기
  const handleSubmitAll = () => {
    if (!isFormValid) return;
    setShowTerms(true);
  };

  // 약관 동의 완료 -> 인증번호 발송 (Step 2 이동)
  const handleConfirmTerms = () => {
    // 필수 약관 체크 확인
    if (!agreements.term1 || !agreements.term2 || !agreements.term3 || !agreements.term4) {
      alert('필수 약관에 동의해주세요.');
      return;
    }
    setShowTerms(false); // 모달 닫기
    
    // [TODO] 실제로는 여기서 서버에 인증번호 요청(API)을 보내야 함
    alert(`[ALAF] ${inputs.carrier} 인증번호 발송: 1234`);
    
    setTimeLeft(180); // 타이머 리셋
    setStep(2); // 다음 단계로
  };

  // 인증번호 재전송
  const handleResend = () => {
    setTimeLeft(180);
    setVerifyCode('');
    alert(`[ALAF] 인증번호가 재발송되었습니다: 1234`);
  };

  // ★ [최종 가입 완료]
  const handleFinalVerification = () => {
    if (timeLeft === 0) {
      alert('입력 시간이 초과되었습니다. 다시 받아주세요.');
      return;
    }
    // [테스트용] 인증번호 '1234'일 때만 통과
    if (verifyCode === '1234') {
      console.log('✅ 최종 가입 정보:', inputs);
      alert(`[가입완료] ${inputs.name}님 환영합니다!`);
      navigate('/mypage'); // 마이페이지로 이동
    } else {
      alert('인증번호가 틀렸습니다.');
    }
  };

  // 공통 헤더 컴포넌트
  const Header = ({ title, onBack }) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30, position: 'relative', justifyContent: 'center' }}>
      <button onClick={onBack} style={{ position: 'absolute', left: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
        <ArrowLeft size={24} color="#333" />
      </button>
      <h2 style={{ fontSize: 18, fontWeight: '700', color: '#333', margin: 0 }}>{title}</h2>
    </div>
  );

  return (
    <div className="pc-container" style={{ alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      
      {/* 흰색 카드 박스 컨테이너 */}
      <div style={{ background: 'white', padding: '40px 30px', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: 420, minHeight: 600, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* =======================================================
            [Step 1] 정보 입력 화면
           ======================================================= */}
        {step === 1 && (
          <>
            <Header title="회원가입" onBack={() => navigate(-1)} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto', paddingRight: 5 }}>
              
              {/* 섹션 1: 계정 정보 */}
              <div style={{ marginBottom: 10 }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: 16, color: '#333' }}>계정 정보</h4>
                
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>아이디</label>
                  <input 
                    name="id" placeholder="아이디 입력" value={inputs.id} 
                    onChange={handleChange} onBlur={handleBlur}
                    style={inputs.id ? activeInputStyle : inputStyle}
                  />
                  {(touched.id && !inputs.id) && <span style={errorTextStyle}>아이디를 입력해주세요</span>}
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>비밀번호</label>
                  <input 
                    name="pw" type="password" placeholder="비밀번호 입력" value={inputs.pw} 
                    onChange={handleChange} onBlur={handleBlur}
                    style={inputs.pw ? activeInputStyle : inputStyle}
                  />
                  {(touched.pw && !inputs.pw) && <span style={errorTextStyle}>비밀번호를 입력해주세요</span>}
                </div>
              </div>

              <div style={{ height: 1, background: '#eee', margin: '5px 0' }}></div>

              {/* 섹션 2: 본인 확인 정보 */}
              <div>
                <h4 style={{ margin: '0 0 15px 0', fontSize: 16, color: '#333' }}>본인 확인</h4>
                
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>이름</label>
                  <input 
                    name="name" placeholder="이름 입력" value={inputs.name} 
                    onChange={handleChange} onBlur={handleBlur}
                    style={inputs.name ? activeInputStyle : inputStyle}
                  />
                  {(touched.name && !inputs.name) && <span style={errorTextStyle}>이름을 입력해주세요</span>}
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>주민등록번호</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        name="rrnFront" placeholder="생년월일 6자리" maxLength="6"
                        value={inputs.rrnFront} onChange={handleChange} onBlur={handleBlur}
                        style={{ ...(inputs.rrnFront.length === 6 ? activeInputStyle : inputStyle), width: '100%', textAlign: 'center' }}
                      />
                    </div>
                    <span style={{ color: '#ccc' }}>-</span>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', border: inputs.gender ? '1px solid #333' : '1px solid #ddd', borderRadius: 8, padding: '0 12px', height: 48 }}>
                      <input 
                        name="gender" maxLength="1" type="text" placeholder="0"
                        value={inputs.gender} onChange={handleChange} onBlur={handleBlur}
                        style={{ border: 'none', outline: 'none', width: 20, fontSize: 16, textAlign: 'center', background:'transparent' }}
                      />
                      {/* 주민번호 뒷자리 마스킹 처리 디자인 */}
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        {[1,2,3,4,5,6].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }}></div>)}
                      </div>
                    </div>
                  </div>
                  {((touched.rrnFront && inputs.rrnFront.length < 6) || (touched.gender && !inputs.gender)) && <span style={errorTextStyle}>주민번호 정보를 정확히 입력해주세요</span>}
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>통신사</label>
                  <select 
                    name="carrier" value={inputs.carrier} onChange={handleChange}
                    style={{ ...inputStyle, color: inputs.carrier ? '#333' : '#aaa', cursor: 'pointer' }}
                  >
                    <option value="" disabled>선택해 주세요</option>
                    <option value="SKT">SKT</option>
                    <option value="KT">KT</option>
                    <option value="LG U+">LG U+</option>
                    <option value="SKT 알뜰폰">SKT 알뜰폰</option>
                    <option value="KT 알뜰폰">KT 알뜰폰</option>
                    <option value="LG U+ 알뜰폰">LG U+ 알뜰폰</option>
                  </select>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>휴대폰번호</label>
                  <input 
                    name="phone" placeholder="-없이 숫자만 입력" maxLength="11"
                    value={inputs.phone} onChange={handleChange} onBlur={handleBlur}
                    style={inputs.phone.length > 9 ? activeInputStyle : inputStyle}
                  />
                  {(touched.phone && inputs.phone.length < 10) && <span style={errorTextStyle}>휴대폰번호를 입력해주세요</span>}
                </div>
              </div>
            </div>

            {/* 인증하고 가입하기 버튼 (모든 정보가 입력되어야 활성화) */}
            <button 
              onClick={handleSubmitAll} disabled={!isFormValid}
              style={{ 
                marginTop: 20, width: '100%', height: 52, borderRadius: 8, border: 'none', 
                background: isFormValid ? '#2c3e50' : '#dcdcdc', color: isFormValid ? 'white' : '#999',
                fontSize: 16, fontWeight: 'bold', cursor: isFormValid ? 'pointer' : 'default',
                flexShrink: 0 
              }}
            >
              인증하고 가입하기
            </button>
          </>
        )}

        {/* =======================================================
            [Modal] 약관 동의 팝업 (Step 1 위로 덮임)
           ======================================================= */}
        {showTerms && (
          <>
            {/* 검은색 반투명 배경 (클릭 시 닫힘) */}
            <div onClick={() => setShowTerms(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 9 }}></div>
            
            {/* 약관 바텀 시트 */}
            <div style={{ 
              position: 'fixed', bottom: 0, left: 0, width: '100%', maxHeight: '85%', 
              background: 'white', zIndex: 10, display: 'flex', flexDirection: 'column',
              borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', animation: 'slideUp 0.3s ease-out'
            }}>
              <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #eee' }}>
                 <h3 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>약관 동의</h3>
                 <button onClick={() => setShowTerms(false)} style={{ position: 'absolute', right: 24, background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#333" /></button>
              </div>
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div onClick={handleAllCheck} style={{ background: '#f8f9fa', padding: '20px', borderRadius: 12, display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: 24 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: agreements.all ? '#0ca678' : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Check size={16} color="white" /></div>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>전체 동의</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <TermItem text="서비스 이용약관 (필수)" checked={agreements.term1} onClick={() => handleSingleCheck('term1')} />
                  <TermItem text="개인정보 수집 및 이용 (필수)" checked={agreements.term2} onClick={() => handleSingleCheck('term2')} />
                  <TermItem text="고유식별정보 처리 동의 (필수)" checked={agreements.term3} onClick={() => handleSingleCheck('term3')} />
                  <TermItem text="통신사 이용약관 동의 (필수)" checked={agreements.term4} onClick={() => handleSingleCheck('term4')} />
                  <TermItem text="이벤트 마케팅 수신 (선택)" checked={agreements.term5} onClick={() => handleSingleCheck('term5')} />
                </div>
              </div>
              <div style={{ padding: '24px', borderTop: '1px solid #eee' }}>
                 <button 
                    onClick={handleConfirmTerms} 
                    style={{ 
                        width: '100%', height: 56, borderRadius: 12, border: 'none', 
                        background: (agreements.term1 && agreements.term2 && agreements.term3 && agreements.term4) ? '#2c3e50' : '#dcdcdc', 
                        color: 'white', fontSize: 18, fontWeight: 'bold', cursor: 'pointer' 
                    }}
                 >
                    확인
                 </button>
              </div>
            </div>
          </>
        )}

        {/* =======================================================
            [Step 2] 인증번호 입력 (최종)
           ======================================================= */}
        {step === 2 && (
          <>
            <Header title="인증번호 입력" onBack={() => setStep(1)} />
            
            <div style={{ flex: 1, paddingTop: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 30 }}>
                인증번호를 입력해주세요.
              </h3>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>인증번호</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    placeholder="인증번호 4자리" maxLength="4"
                    value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 60 }} 
                  />
                  {/* 타이머 표시 */}
                  <span style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', color: '#ff6b6b', fontSize: 14, fontWeight: '500' }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 15, textAlign: 'center', fontSize: 13, color: '#888' }}>
                인증번호를 받지 못하셨나요? 
                <span onClick={handleResend} style={{ marginLeft: 5, color: '#333', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>다시 받기</span>
              </div>
            </div>

            <button 
              onClick={handleFinalVerification} 
              disabled={verifyCode.length < 4}
              style={{ 
                ...activeButtonStyle, marginTop: 20, 
                background: verifyCode.length >= 4 ? '#2c3e50' : '#dcdcdc',
                cursor: verifyCode.length >= 4 ? 'pointer' : 'default'
              }}
            >
              가입 완료
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* --- 하위 컴포넌트 & 스타일 (파일 하단에 정리) --- */

const TermItem = ({ text, checked, onClick }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: checked ? 'none' : '1px solid #ddd', background: checked ? '#0ca678' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
        {checked && <Check size={14} color="white" />}
      </div>
      <span style={{ fontSize: 14, color: '#333' }}>{text}</span>
    </div>
    <ChevronRight size={18} color="#ccc" />
  </div>
);

// CSS 스타일 객체들
const labelStyle = { display: 'block', fontSize: 13, color: '#666', marginBottom: 8 };
const fieldGroupStyle = { marginBottom: 20 };
const errorTextStyle = { display: 'block', fontSize: 12, color: '#ff6b6b', marginTop: 6 };
const inputStyle = { width: '100%', height: 48, padding: '0 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, outline: 'none', boxSizing: 'border-box' };
const activeInputStyle = { ...inputStyle, border: '1px solid #333' };
const activeButtonStyle = { width: '100%', height: 52, borderRadius: 8, border: 'none', background: '#2c3e50', color: 'white', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' };

// 애니메이션 주입 (모달이 아래에서 올라오는 효과)
const slideUpStyle = document.createElement('style');
slideUpStyle.innerHTML = `@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`;
document.head.appendChild(slideUpStyle);

export default WebSignup;