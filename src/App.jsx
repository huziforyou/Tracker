import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CameraCapture from './components/CameraCapture';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CameraCapture onSuccess={() => {}} />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
