import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // הוספנו useNavigate
import './styles/App.css';

import SoldierHome from './pages/SoldierHome';
import NewSuggestion from './pages/NewSuggestion';
import NewSuggestionDetails from './pages/NewSuggestionDetails';
import SuggestionSuccess from './pages/SuggestionSuccess';
import SoldierSuggestions from './pages/SoldierSuggestions';
import AdminDashboard from './admin/AdminDashboard';
import AdminStats from './admin/AdminStats';
import AdminLogin from './admin/AdminLogin'; // הייבוא החדש

// רכיב שבודק אם מותר להיכנס ("שומר בשער")
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin'); // אם לא מנהל - זורק אותו למסך הלוגין
    }
  }, [isAdmin, navigate]);

  return isAdmin ? children : null;
};

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<SoldierHome />} />
        <Route path="/new-suggestion" element={<NewSuggestion />} />
        <Route path="/new-suggestion-details" element={<NewSuggestionDetails />} />
        <Route path="/success" element={<SuggestionSuccess />} />
        <Route path="/my-suggestions" element={<SoldierSuggestions />} />

        {/* מסך הלוגין הוא עכשיו הכניסה לניהול */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* הנתיבים המוגנים - דורשים סיסמה */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/stats" element={
          <ProtectedRoute>
            <AdminStats />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;