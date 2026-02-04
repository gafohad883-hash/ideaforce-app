// src/pages/SoldierSuggestions.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import '../styles/SoldierSuggestions.css';

function SoldierSuggestions() {
  const navigate = useNavigate();
  const [inputId, setInputId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (inputId.length !== 9) {
        alert("נא להזין תעודת זהות תקינה (9 ספרות)");
        return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions`);
      if (res.ok) {
        const allData = await res.json();
        
        // --- התיקון כאן: בודקים גם ת"ז וגם מ.א ישן ליתר ביטחון ---
        const myData = allData.filter(s => {
            const savedId = s.soldier?.idNumber || s.soldier?.personalNumber || '';
            return savedId.toString() === inputId.toString();
        });

        setSuggestions(myData);
        setHasSearched(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'מאושר': return 'status-green';
      case 'נדחה': return 'status-red';
      case 'בטיפול': return 'status-blue';
      default: return 'status-gray';
    }
  };

  return (
    <div className="mysug-container">
      <header className="mysug-header">
        <h2>ההצעות שלי</h2>
      </header>

      <div className="mysug-content">
        <div className="search-section">
            <p>הכנס תעודת זהות לצפייה בסטטוס הצעות:</p>
            <div className="search-box-row">
                <input 
                    type="number" 
                    placeholder="תעודת זהות (9 ספרות)" 
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                />
                <button onClick={handleSearch} disabled={loading}>
                    {loading ? '...' : 'הצג'}
                </button>
            </div>
        </div>

        {hasSearched && (
            <div className="suggestions-list">
                {suggestions.length === 0 ? (
                <p className="no-data">לא נמצאו הצעות עבור ת"ז זו.</p>
                ) : (
                suggestions.map((item) => (
                    <div key={item._id || item.id} className="suggestion-card-mini">
                    <div className="card-top">
                        <span className="card-id">#{item.id}</span>
                        <span className={`card-status ${getStatusClass(item.status)}`}>
                        {item.status}
                        </span>
                    </div>
                    <h3>{item.title}</h3>
                    <div className="card-info">
                        <span>📅 {item.date}</span>
                        <span>תחום: {item.domain}</span>
                    </div>
                    </div>
                ))
                )}
            </div>
        )}

        <button className="back-home-btn" onClick={() => navigate('/')}>
          חזרה למסך הבית
        </button>
      </div>
    </div>
  );
}

export default SoldierSuggestions;