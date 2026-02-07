// src/context/UserContext.js
import React, { createContext, useState } from 'react';

// 전역에서 사용자 정보(로그인 여부)를 공유하기 위한 Context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // 로그인 상태 관리 (null: 비로그인, 객체: 로그인 성공)
  const [user, setUser] = useState(null); 

  // -----------------------------------------------------------
  // [로그인 함수] (현재 테스트용 가짜 로직)
  // ※ 추후 백엔드 API (POST /api/login)와 연동해야 함
  // -----------------------------------------------------------
  const login = (id, password) => {
    // [TODO] 실제 서버 통신 코드로 교체 필요
    // 지금은 아이디만 입력하면 무조건 '홍길동'으로 로그인 성공 처리
    const mockUser = {
      id: 1,
      userId: id,
      name: '홍길동', // 임의의 데이터
      department: '컴퓨터공학과',
      studentId: '20261234'
    };
    setUser(mockUser);
    return true; // 성공했다고 가정
  };

  // [로그아웃 함수]
  const logout = () => {
    setUser(null); // 상태 초기화
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};