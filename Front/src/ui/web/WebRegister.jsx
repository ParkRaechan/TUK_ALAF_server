import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ItemContext } from '../../context/ItemContext';
import { ArrowLeft, Camera, X } from 'lucide-react';

// -----------------------------------------------------------
// [카테고리 데이터] 대분류(Key) - 소분류(Value) 매핑
// -----------------------------------------------------------
const CATEGORY_DATA = {
  '가방': ['여성용가방', '남성용가방', '기타가방'],
  '귀금속': ['반지', '목걸이', '귀걸이', '시계', '기타'],
  '도서용품': ['학습서적', '소설', '컴퓨터서적', '만화책', '기타서적'],
  '서류': ['서류', '기타물품'],
  '쇼핑백': ['쇼핑백'],
  '스포츠용품': ['스포츠용품'],
  '악기': ['건반악기', '타악기', '관악기', '현악기', '기타악기'],
  '유가증권': ['어음', '상품권', '채권', '기타'],
  '의류': ['여성의류', '남성의류', '아기의류', '모자', '신발', '기타의류'],
  '자동차': ['자동차열쇠', '네비게이션', '자동차번호판', '임시번호판', '기타용품'],
  '전자기기': ['태블릿', '스마트워치', '무선이어폰', '카메라', '기타용품'],
  '지갑': ['여성용지갑', '남성용지갑', '기타지갑'],
  '증명서': ['신분증', '면허증', '여권', '기타'],
  '컴퓨터': ['삼성노트북', 'LG노트북', '애플노트북', '기타'],
  '카드': ['신용(체크)카드', '일반카드', '교통카드', '기타카드'],
  '현금': ['현금'],
  '휴대폰': ['삼성휴대폰', 'LG휴대폰', '아이폰', '기타휴대폰', '기타통신기기'],
  '유류품': ['무안공항유류품', '유류품'],
  '무주물': ['무주물'],
  '기타물품': ['기타물품']
};

const WebRegister = () => {
  const { addItem } = useContext(ItemContext);
  const navigate = useNavigate();
  
  // 파일 선택창을 프로그램적으로 열기 위한 Ref
  const fileInputRef = useRef(null);

  // 1. 대분류 상태 관리 (기본값: 가방)
  const [majorCategory, setMajorCategory] = useState('가방');

  // 2. 입력 폼 상태 관리
  const [inputs, setInputs] = useState({
    title: '',
    category: '여성용가방', // 기본값: 가방의 첫 번째 소분류
    location: '',
    date: '',
    desc: '',
    image: null // 화면 표시용 미리보기 URL
  });

  // ★ [중요] 서버로 전송할 실제 파일 객체 저장소
  const [realImageFile, setRealImageFile] = useState(null);

  // -----------------------------------------------------------
  // [카테고리 변경 핸들러]
  // 대분류가 바뀌면 -> 소분류 목록도 바뀌어야 하므로 첫 번째 값으로 자동 세팅
  // -----------------------------------------------------------
  const handleMajorChange = (e) => {
    const newMajor = e.target.value;
    setMajorCategory(newMajor);
    
    // 입력값(inputs)의 소분류도 업데이트
    setInputs(prev => ({
      ...prev,
      category: CATEGORY_DATA[newMajor][0] // 해당 대분류의 첫 번째 소분류 자동 선택
    }));
  };

  // 일반 텍스트 입력 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  // -----------------------------------------------------------
  // [이미지 업로드 로직]
  // -----------------------------------------------------------
  // 박스 클릭 시 숨겨진 <input type="file"> 클릭 트리거
  const handleBoxClick = () => fileInputRef.current.click();
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. 화면에 보여줄 미리보기 URL 생성 (브라우저 메모리상 URL)
      const imageUrl = URL.createObjectURL(file);
      setInputs({ ...inputs, image: imageUrl });
      
      // 2. 서버로 보낼 진짜 파일 객체 저장
      setRealImageFile(file);
    }
  };

  // 이미지 삭제 버튼
  const handleRemoveImage = (e) => {
    e.stopPropagation(); // 부모 클릭 이벤트 전파 방지 (파일창 열림 방지)
    setInputs({ ...inputs, image: null });
    setRealImageFile(null); // 파일 객체도 삭제
  };

  // -----------------------------------------------------------
  // [등록 완료 핸들러]
  // -----------------------------------------------------------
  const handleSubmit = async () => {
    // 필수값 검증
    if (!inputs.title || !inputs.location || !inputs.date) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

   // Context의 addItem 함수 호출 (서버 전송)
   // 입력 데이터와 이미지 파일을 함께 보냄
   const success = await addItem(inputs, realImageFile);

    if (success) {
      alert('습득물이 서버에 등록되었습니다!');
      navigate('/'); // 메인 화면으로 이동
    }
  };

  return (
    <div className="pc-container">
      
      {/* 헤더 (뒤로가기 버튼) */}
      <header className="pc-header">
        <div className="header-inner">
           <button 
             onClick={() => navigate(-1)} 
             style={{display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontWeight:'bold', fontSize: 16, border:'none', background:'none'}}
           >
             <ArrowLeft size={24} /> 뒤로가기
           </button>
        </div>
      </header>

      <main className="pc-main">
        {/* 등록 폼 컨테이너 (흰색 박스) */}
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', padding: 40, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ borderBottom: '2px solid #333', paddingBottom: 20, marginBottom: 30 }}>
            습득물 등록
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* 물건명 입력 */}
            <div className="form-group">
              <label style={{display:'block', fontWeight:'bold', marginBottom:8}}>물건명 (필수)</label>
              <input name="title" placeholder="예: 삼성 갤럭시 S24" value={inputs.title} onChange={handleChange} style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #ddd'}} />
            </div>

            {/* ★ 카테고리 선택 영역 (2단 구조: 대분류 -> 소분류) */}
            <div style={{ display: 'flex', gap: 20 }}>
              
              {/* 1. 대분류 드롭다운 */}
              <div style={{ flex: 1 }}>
                <label style={{display:'block', fontWeight:'bold', marginBottom:8}}>대분류</label>
                <select 
                  value={majorCategory} 
                  onChange={handleMajorChange} 
                  style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #ddd', cursor:'pointer'}}
                >
                  {/* CATEGORY_DATA의 키값들로 옵션 생성 */}
                  {Object.keys(CATEGORY_DATA).map(major => (
                    <option key={major} value={major}>{major}</option>
                  ))}
                </select>
              </div>

              {/* 2. 소분류 드롭다운 (선택된 대분류에 따라 목록이 바뀜) */}
              <div style={{ flex: 1 }}>
                <label style={{display:'block', fontWeight:'bold', marginBottom:8}}>상세 분류</label>
                <select 
                  name="category" 
                  value={inputs.category} 
                  onChange={handleChange} 
                  style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #ddd', cursor:'pointer'}}
                >
                  {/* 선택된 대분류(majorCategory)에 해당하는 배열로 옵션 생성 */}
                  {CATEGORY_DATA[majorCategory].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* 날짜 및 장소 입력 */}
            <div style={{ display: 'flex', gap: 20 }}>
               <div style={{ flex: 1 }}>
                <label style={{display:'block', fontWeight:'bold', marginBottom:8}}>습득 날짜 (필수)</label>
                <input name="date" type="date" value={inputs.date} onChange={handleChange} style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #ddd'}} />
              </div>
              <div style={{ flex: 1 }}>
                 <label style={{display:'block', fontWeight:'bold', marginBottom:8}}>습득 장소 (필수)</label>
                 <input name="location" placeholder="예: 공학관 304호" value={inputs.location} onChange={handleChange} style={{width:'100%', padding:12, borderRadius:8, border:'1px solid #ddd'}} />
              </div>
            </div>

            {/* 사진 첨부 영역 */}
            <div className="form-group">
              <label style={{display:'block', fontWeight:'bold', marginBottom:8}}>사진 첨부</label>
              
              {/* 실제 파일 입력창은 숨김 처리 (display: none) */}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
              
              {/* 커스텀 디자인된 업로드 박스 */}
              <div onClick={handleBoxClick} style={{ width: '100%', height: 250, background: inputs.image ? `url(${inputs.image}) center/contain no-repeat #f8f9fa` : '#f8f9fa', borderRadius: 10, border: '2px dashed #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', cursor: 'pointer', position: 'relative' }}>
                {!inputs.image ? (
                  // 이미지가 없을 때: 카메라 아이콘 표시
                  <>
                    <Camera size={40} style={{ marginBottom: 10 }} />
                    <span>클릭해서 사진 업로드</span>
                  </>
                ) : (
                  // 이미지가 있을 때: X 버튼 표시
                  <button onClick={handleRemoveImage} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                )}
              </div>
            </div>

            {/* 상세 설명 */}
            <div className="form-group">
              <label style={{display:'block', fontWeight:'bold', marginBottom:8}}>상세 설명</label>
              <textarea name="desc" placeholder="내용 입력" value={inputs.desc} onChange={handleChange} style={{width:'100%', height: 120, padding:12, borderRadius:8, border:'1px solid #ddd', resize:'none'}} />
            </div>

            {/* 등록 완료 버튼 */}
            <button onClick={handleSubmit} style={{ width: '100%', padding: 16, background: '#2c3e50', color: 'white', borderRadius: 10, fontSize: 18, fontWeight: 'bold', marginTop: 20, cursor: 'pointer', border: 'none' }}>등록 완료</button>

          </div>
        </div>
      </main>
    </div>
  );
};

export default WebRegister;