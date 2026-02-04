import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // הסיסמה שבחרת
    if (password === 'avtahut123') { 
      // שמירת אישור שהמנהל מחובר
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('סיסמה שגויה. הגישה למורשים בלבד.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>כניסת מנהל מערכת 🔒</h2>
        <p>נא להזין סיסמת גישה</p>
        
        <input 
          type="password" 
          placeholder="סיסמה" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        
        {error && <p className="error-msg">{error}</p>}
        
        <button onClick={handleLogin}>כניסה</button>
        <button className="back-link" onClick={() => navigate('/')}>חזרה למסך הבית</button>
      </div>
    </div>
  );
}

export default AdminLogin;