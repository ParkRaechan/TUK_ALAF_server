import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ItemContext = createContext();

export const ItemProvider = ({ children }) => {
  const [items, setItems] = useState([]); // 게시글 목록 상태
  const BASE_URL = 'http://localhost:8080'; // 서버 주소

  // -----------------------------------------------------------
  // 1. [목록 조회] GET /api/items
  // 메인 화면에 뿌려줄 간단한 리스트 정보를 가져옵니다.
  // -----------------------------------------------------------
  const fetchItems = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/items`);
      
      // DB 칼럼명(snake_case) -> 리액트 변수명(camelCase) 변환
      const mappedList = response.data.map(dbItem => ({
        id: dbItem.item_id,
        title: dbItem.name,
        date: dbItem.created_at ? dbItem.created_at.split('T')[0] : '', // 날짜 포맷팅
        image: dbItem.image_url ? `${BASE_URL}${dbItem.image_url}` : null, // 이미지 전체 경로 완성
        status: '보관중'
      }));
      
      setItems(mappedList);
    } catch (error) {
      console.error("목록 로드 실패:", error);
    }
  };

  // 앱 실행 시 목록 한 번 불러오기
  useEffect(() => {
    fetchItems();
  }, []);

  // -----------------------------------------------------------
  // 2. [상세 조회] GET /api/items/:id
  // 클릭한 물건의 상세 정보(설명, 위치 등)를 가져옵니다.
  // -----------------------------------------------------------
  const getItemDetail = async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/items/${id}`);
      const data = response.data;
      
      return {
        id: data.item_id,
        title: data.name,
        date: data.found_date ? data.found_date.split('T')[0] : '',
        location: `${data.address || ''} ${data.detail_address || ''}`, // 주소 합치기
        category: data.category_name || '기타',
        desc: data.description || '내용 없음',
        image: data.image_url ? `${BASE_URL}${data.image_url}` : null,
        status: data.status
      };
    } catch (error) {
      console.error("상세 정보 로드 실패:", error);
      return null;
    }
  };

  // -----------------------------------------------------------
  // 3. [물건 등록] POST /api/items
  // 입력한 정보와 이미지를 FormData로 묶어서 서버로 보냅니다.
  // -----------------------------------------------------------
  const addItem = async (inputs, imageFile) => {
    try {
      const formData = new FormData();
      
      // 텍스트 데이터 추가
      formData.append('name', inputs.title);
      formData.append('description', inputs.desc);
      formData.append('found_date', inputs.date);
      
      // 카테고리명(한글) -> 카테고리ID(숫자) 변환
      const categoryMap = { 
        '전자기기': 1, '지갑': 2, '지갑/카드': 2, 
        '가방': 3, '의류': 4, '기타': 5 
      };
      formData.append('category_id', categoryMap[inputs.category] || 5);
      
      // 장소명 -> 장소ID 변환 (임시 로직)
      let placeId = 1; // 기본값: 공학관
      if (inputs.location.includes('학생')) placeId = 2;
      else if (inputs.location.includes('도서')) placeId = 3;
      formData.append('place_id', placeId);

      // 이미지 파일 추가
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // 서버 전송 (Multipart)
      await axios.post(`${BASE_URL}/api/items`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      fetchItems(); // 목록 갱신
      return true;

    } catch (error) {
      console.error("등록 실패:", error);
      alert(`등록 실패: ${error.response?.data?.error || error.message}`);
      return false;
    }
  };

  return (
    <ItemContext.Provider value={{ items, fetchItems, getItemDetail, addItem, BASE_URL }}>
      {children}
    </ItemContext.Provider>
  );
};