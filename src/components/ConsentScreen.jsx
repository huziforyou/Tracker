import React from 'react';

function ConsentScreen({ onConsent }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Permission Required</h1>
        <p className="text-gray-600 mb-2 leading-relaxed">
          This demonstration will request access to your camera and location for demonstration purposes only.
        </p>
        <p className="text-gray-600 mb-4">We will capture:</p>
        <ul className="text-left mb-8 list-disc list-inside text-gray-600">
          <li>A single selfie</li>
          <li>Your current GPS coordinates</li>
          <li>Basic browser information</li>
        </ul>
        <button
          onClick={onConsent}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          I Understand, Continue
        </button>
      </div>
    </div>
  );
}

export default ConsentScreen;
