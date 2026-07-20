import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function AdminDashboard() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchRecords();
    const socket = io(API_BASE_URL);
    socket.on('newRecord', (record) => {
      setRecords(prev => [record, ...prev]);
    });
    return () => socket.disconnect();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/records`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map(record => (
            <div key={record._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4">
                <img
                  src={`${API_BASE_URL}/uploads/${record.selfie}`}
                  alt="Selfie"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Location:</strong></p>
                  <a
                    href={`https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                  </a>
                  <p><strong>Browser:</strong> {record.browserInfo?.browserName}</p>
                  <p><strong>OS:</strong> {record.browserInfo?.os}</p>
                  <p><strong>Resolution:</strong> {record.browserInfo?.screenResolution}</p>
                  <p><strong>Language:</strong> {record.browserInfo?.language}</p>
                  <p><strong>Time Zone:</strong> {record.browserInfo?.timeZone}</p>
                  <p><strong>Timestamp:</strong> {new Date(record.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
