import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './styles/App.css';

import SoldierHome from './pages/SoldierHome';
import NewSuggestion from './pages/NewSuggestion';
import NewSuggestionDetails from './pages/NewSuggestionDetails';
import SuggestionSuccess from './pages/SuggestionSuccess';
import SoldierSuggestions from './pages/SoldierSuggestions';
import SoldierSuggestionDetails from './pages/SoldierSuggestionDetails';
import AdminDashboard from './admin/AdminDashboard';
import AdminStats from './admin/AdminStats';
import AdminLogin from './admin/AdminLogin';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
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
        <Route path="/my-suggestions/details" element={<SoldierSuggestionDetails />} />

        <Route path="/admin" element={<AdminLogin />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute>
              <AdminStats />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;