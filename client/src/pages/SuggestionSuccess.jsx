// src/pages/SuggestionSuccess.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SuggestionSuccess.css';

function SuggestionSuccess() {
  const navigate = useNavigate();

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✔</div>
        <h2>ההצעה נשלחה בהצלחה!</h2>
        <p>
          הצעתך נקלטה במערכת IdeaForce ותועבר לבחינת הגורמים הרלוונטיים.
          תודה על תרומתך לשיפור היחידה.
        </p>

        <div className="success-buttons">
          <button 
            className="success-primary-btn"
            onClick={() => navigate('/')}
          >
            חזרה למסך הבית
          </button>

          <button 
            className="success-secondary-btn"
            onClick={() => navigate('/new-suggestion')}
          >
            הגשת הצעה נוספת
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuggestionSuccess;