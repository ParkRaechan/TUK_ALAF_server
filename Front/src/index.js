// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// -----------------------------------------------------------
// [1] 리액트 앱의 시작점 (Entry Point)
// 실제 HTML 파일(public/index.html)에 있는 <div id="root">를 찾아서
// 우리가 만든 리액트 앱(<App />)을 그 안에 집어넣습니다.
// -----------------------------------------------------------
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // [2] StrictMode: 개발 모드에서 잠재적인 문제를 감지하기 위한 안전장치
  // (※ 주의: 이것 때문에 개발 중에는 console.log가 두 번씩 찍힐 수 있음 -> 정상임!)
  <React.StrictMode>
    <App />
  </React.StrictMode>
);