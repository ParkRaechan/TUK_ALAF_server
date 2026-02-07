import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Menu, ChevronRight } from 'lucide-react'; 
import { ItemContext } from '../../context/ItemContext';
import './WebHome.css';

// -----------------------------------------------------------
// [상수 데이터] 카테고리 대분류 - 소분류 정의
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

const WebHome = () => {
  const { items } = useContext(ItemContext); // 전체 물건 데이터 가져오기
  const navigate = useNavigate();

  // -----------------------------------------------------------
  // 1. [상태 관리] 필터링 및 정렬을 위한 변수들
  // -----------------------------------------------------------
  const [activeCategory, setActiveCategory] = useState('전체'); // 현재 선택된 카테고리
  const [sortBy, setSortBy] = useState('date');   // 정렬 기준 (최신순/조회순)
  const [searchTerm, setSearchTerm] = useState(''); // 검색어

  // -----------------------------------------------------------
  // 2. [데이터 가공 함수] 
  // 원본 데이터(items) -> 카테고리 필터 -> 검색어 필터 -> 정렬 -> 최종 결과
  // -----------------------------------------------------------
  const getProcessedItems = () => {
    let processed = items;

    // (1) 카테고리 필터링 ('전체'가 아닐 때만 수행)
    if (activeCategory !== '전체') {
      // 대분류를 선택했지만, 실제 DB에는 세부 카테고리가 들어있을 수 있으므로
      // 여기서는 단순 예시로 activeCategory와 일치하는지 확인합니다.
      // (실제 구현 시에는 소분류 포함 여부를 체크하는 로직이 필요할 수 있음)
      processed = processed.filter(item => item.category === activeCategory);
    }

    // (2) 검색어 필터링 (제목 또는 장소에 검색어 포함 여부 확인)
    if (searchTerm.trim() !== '') {
      const lowerQuery = searchTerm.toLowerCase(); // 대소문자 무시
      processed = processed.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        item.location.toLowerCase().includes(lowerQuery)
      );
    }
    
    // (3) 정렬 (최신순 / 조회순)
    return [...processed].sort((a, b) => {
      if (sortBy === 'date') {
        // 날짜 내림차순 (최신 날짜가 먼저)
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'views') {
        // 조회수 내림차순 (높은 게 먼저)
        return (b.views || 0) - (a.views || 0);
      }
      return 0;
    });
  };

  const finalItems = getProcessedItems(); // 화면에 뿌려질 최종 데이터

  return (
    <div className="pc-container">
      
      {/* --- 헤더 영역 --- */}
      <header className="pc-header">
        <div className="header-inner">
          {/* 로고 (클릭 시 새로고침 효과) */}
          <div className="logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
            <h1>ALAF</h1>
            <span className="logo-sub">Any Lost Any Found</span>
          </div>

          {/* 검색창 */}
          <div className="pc-search-bar">
            <input 
              type="text" 
              placeholder="물건명, 장소 등으로 검색" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} // 입력값 실시간 반영
            />
            <button><Search size={20} /></button>
          </div>

          {/* 우측 메뉴 */}
          <div className="pc-nav-menu">
             <button className="menu-item" onClick={() => navigate('/')}>게시글</button>
             <button className="menu-item primary" onClick={() => navigate('/register')}>분실물 등록</button>
             <button className="menu-item" onClick={() => navigate('/mypage')}>마이페이지</button>
          </div>
        </div>
      </header>

      <main className="pc-main">
        
        {/* --- 카테고리 드롭다운 (Hover 시 펼쳐지는 메뉴) --- */}
        <div className="category-dropdown-container">
          <div className="dropdown-trigger">
            <Menu size={24} color="white" />
            <span>카테고리</span>
          </div>

          <ul className="main-menu">
            {/* '전체 보기' 메뉴 */}
            <li className="menu-item-li" onClick={() => setActiveCategory('전체')}>
              <span className="menu-text">전체 보기</span>
            </li>
            
            {/* CATEGORY_DATA를 순회하며 메뉴 생성 */}
            {Object.keys(CATEGORY_DATA).map((majorCat) => (
              <li key={majorCat} className="menu-item-li">
                <span className="menu-text">{majorCat}</span>
                <ChevronRight size={16} color="#ccc" className="arrow-icon" />
                
                {/* 마우스 올리면 나타나는 소분류 패널 */}
                <div className="sub-menu-panel">
                  <h4 className="sub-menu-title">{majorCat}</h4>
                  <div className="sub-menu-grid">
                    {CATEGORY_DATA[majorCat].map((subCat) => (
                      <button 
                        key={subCat} 
                        className="sub-cat-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // 부모 클릭 이벤트 방지
                          setActiveCategory(subCat); // 소분류 선택
                        }}
                      >
                        {subCat}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* --- 섹션 헤더 (제목 및 정렬) --- */}
        <div className="section-header">
          <h2>
             {searchTerm 
               ? `🔍 "${searchTerm}" 검색 결과` 
               : (activeCategory === '전체' ? '📢 실시간 습득물 현황' : `📂 ${activeCategory}`)}
          </h2>
          <div className="sort-options">
            <span 
              className={sortBy === 'date' ? 'active-sort' : ''} 
              onClick={() => setSortBy('date')}
              style={{ cursor: 'pointer', fontWeight: sortBy === 'date' ? 'bold' : 'normal', color: sortBy === 'date' ? '#333' : '#999' }}
            >
              최신순
            </span>
            <span style={{ margin: '0 5px', color: '#ddd' }}>|</span>
            <span 
              className={sortBy === 'views' ? 'active-sort' : ''} 
              onClick={() => setSortBy('views')}
              style={{ cursor: 'pointer', fontWeight: sortBy === 'views' ? 'bold' : 'normal', color: sortBy === 'views' ? '#333' : '#999' }}
            >
              조회순
            </span>
          </div>
        </div>

        {/* --- 물건 리스트 (그리드) --- */}
        <div className="pc-grid">
          {finalItems.length > 0 ? (
            finalItems.map((data) => (
              <div 
                key={data.id} 
                className="pc-card"
                onClick={() => navigate(`/detail/${data.id}`)}
              >
                {/* 이미지 영역 */}
                <div className="card-img" style={{backgroundColor: data.imgColor || '#eee', overflow: 'hidden'}}>
                  {data.image ? (
                    <img 
                      src={data.image} 
                      alt="물건 사진" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span className="img-text">No Image</span>
                  )}
                </div>
                
                {/* 정보 영역 */}
                <div className="card-info">
                  <h3 className="card-title">{data.title}</h3>
                  <div className="card-meta">
                    <span className="card-date">{data.date}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>
                    조회 {data.views || 0}회
                  </div>
                  <div className={`card-status ${data.status === '해결됨' ? 'done' : ''}`}>
                    {data.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // 검색 결과가 없을 때
            <div style={{ gridColumn: '1 / -1', padding: 100, textAlign: 'center', color: '#888', background: 'white', borderRadius: 16 }}>
              {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '해당 카테고리의 물건이 없습니다.'}
            </div>
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="pc-footer">
        <p>© 2026 ALAF Team. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default WebHome;