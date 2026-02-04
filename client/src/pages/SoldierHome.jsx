// src/pages/SoldierHome.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SoldierHome.css';

function SoldierHome() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>IdeaForce</h1>
        <p className="home-subtitle">מערכת הצעות ייעול בבסיס</p>
      </header>

      <main className="home-main">
        <div className="home-card">
          <h2 className="home-title">ברוכה הבאה למערכת</h2>
          <p className="home-text">
            כאן ניתן להגיש הצעות לשיפור תהליכים, בטיחות, הדרכה ואיכות,
            ולעקוב אחר מצב הטיפול בהן.
          </p>

          <div className="home-buttons">
            <button 
              className="home-primary-btn"
              onClick={() => navigate('/new-suggestion')}
            >
              שליחת הצעת ייעול חדשה
            </button>

            <button 
              className="home-secondary-btn"
              onClick={() => navigate('/my-suggestions')}
            >
              ההצעות שלי
            </button>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>מערכת פנימית לשימוש חיילי ומפקדי הבסיס בלבד.</p>
      </footer>
    </div>
  );
}

export default SoldierHome;