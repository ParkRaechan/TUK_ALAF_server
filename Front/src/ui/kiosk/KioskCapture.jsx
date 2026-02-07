import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ItemContext } from '../../context/ItemContext';
import { ArrowLeft, Camera, RefreshCw, Check } from 'lucide-react';

const KioskCapture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useContext(ItemContext);

  // -----------------------------------------------------------
  // 1. 이전 화면(입력 폼)에서 넘겨준 데이터 받기
  // navigate('/kiosk/capture', { state: inputs }) 로 보낸 데이터를 여기서 받음
  // -----------------------------------------------------------
  const formData = location.state;

  // [예외 처리] 데이터 없이 주소로 바로 들어왔을 경우 튕겨내기
  useEffect(() => {
    if (!formData) {
      alert("잘못된 접근입니다.");
      navigate('/kiosk');
    }
  }, [formData, navigate]);

  // -----------------------------------------------------------
  // 2. 카메라 & 이미지 상태 관리
  // videoRef: 실시간 카메라 화면을 보여줄 <video> 태그 연결
  // canvasRef: 찰칵! 찍은 순간을 그릴 투명한 <canvas> 태그 연결
  // -----------------------------------------------------------
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);   // 서버로 보낼 실제 파일 객체
  const [previewUrl, setPreviewUrl] = useState(null); // 화면에 보여줄 미리보기 URL

  // -----------------------------------------------------------
  // 3. 카메라 실행 (컴포넌트가 켜지면 자동 실행)
  // -----------------------------------------------------------
  useEffect(() => {
    const startCamera = async () => {
      try {
        // 브라우저에게 카메라 권한 요청
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // <video> 태그에 카메라 스트림 연결
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("카메라 오류:", err);
      }
    };

    // 이미 찍은 사진이 없을 때만 카메라 켜기
    if (!previewUrl) startCamera();

    // [청소] 화면을 나갈 때 카메라 끄기 (메모리 누수 방지)
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [previewUrl]);

  // -----------------------------------------------------------
  // 4. [촬영 기능] 비디오 화면 -> 캔버스 -> 이미지 파일 변환
  // -----------------------------------------------------------
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 현재 비디오 화면을 캔버스에 '그림' (캡처 효과)
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // 그린 그림을 파일(Blob) 형태로 변환
    canvas.toBlob(blob => {
      const file = new File([blob], "capture.png", { type: "image/png" });
      setImageFile(file); // 전송용 파일 저장
      setPreviewUrl(URL.createObjectURL(file)); // 미리보기용 URL 생성
    });
  };

  // 다시 찍기 (파일 초기화 후 카메라 재시작)
  const retakePhoto = () => {
    setPreviewUrl(null);
    setImageFile(null);
  };

  // -----------------------------------------------------------
  // 5. [최종 등록] 텍스트 정보 + 이미지 파일 서버 전송
  // -----------------------------------------------------------
  const handleImageRegister = async () => {
    if (!imageFile) return alert("사진을 촬영해주세요!");

    // (선택사항) 설명란에 회원 ID 정보를 덧붙임
    let finalDesc = formData.desc;
    if (formData.userId) finalDesc += `\n(습득자 ID: ${formData.userId})`;
    
    // Context의 addItem 함수 호출 (서버 통신)
    const success = await addItem({ ...formData, desc: finalDesc }, imageFile);
    
    if (success) { 
        // 성공 시 '보관함 열림(Locker)' 화면으로 이동
        // 이때도 입력했던 정보와 방금 찍은 사진을 넘겨줌 (확인 화면용)
        navigate('/kiosk/locker', { 
            state: { ...formData, imageUrl: previewUrl } 
        }); 
    }
  };

  // 데이터 로딩 전에는 아무것도 안 보여줌 (에러 방지)
  if (!formData) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'black' }}>
      
      {/* 상단 헤더 (뒤로가기) */}
      <div style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', height: 50, position:'absolute', top:0, left:0, right:0, zIndex:10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={24} color="white" />
        </button>
        <h1 style={{ marginLeft: 10, fontSize: 18, color:'white', margin:'0 0 0 10px' }}>이미지 촬영 (2/2)</h1>
      </div>

      {/* 카메라 뷰파인더 영역 */}
      <div style={{ flex: 1, position: 'relative', display:'flex', justifyContent:'center', alignItems:'center', overflow:'hidden' }}>
        
        {/* 상태에 따라 비디오(라이브) 또는 이미지(캡처본) 보여주기 */}
        {!previewUrl ? (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <img src={previewUrl} alt="Capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        
        {/* 캡처를 위해 존재하지만 눈에는 안 보이는 캔버스 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* 하단 컨트롤 버튼 영역 */}
        <div style={{ position: 'absolute', bottom: 20, display:'flex', justifyContent:'center', gap: 20, width:'100%' }}>
          
          {/* 촬영 or 다시찍기 버튼 토글 */}
          <button 
            onClick={previewUrl ? retakePhoto : capturePhoto}
            style={{ 
              width: 70, height: 70, borderRadius: '50%', background: previewUrl ? '#fff' : 'white', 
              border: previewUrl ? 'none' : '5px solid #ccc', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}
          >
            {previewUrl ? <RefreshCw size={30} color="#555"/> : <Camera size={40} color="#333"/>}
          </button>

          {/* 등록 버튼 (사진이 있을 때만 등장) */}
          {previewUrl && (
             <button 
             onClick={handleImageRegister}
             style={{ 
               height: 70, padding: '0 30px', borderRadius: 35, 
               background: '#2ecc71', border: 'none', color:'white', fontSize: 20, fontWeight:'bold', 
               display:'flex', alignItems:'center', gap:10, cursor:'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
             }}
           >
             <Check size={30} /> 이미지 등록
           </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KioskCapture;