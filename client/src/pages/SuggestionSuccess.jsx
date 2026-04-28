import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/SuggestionSuccess.css';

function SuggestionSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const successState = location.state || {};
  const isDuplicate = Boolean(successState.isDuplicate);
  const emailSent = successState.emailSent !== false;
  const duplicateHint = successState.duplicateOfId
    ? `נמצאה התאמה אפשרית להצעה ${successState.duplicateOfId}${successState.duplicateOfTitle ? ` - ${successState.duplicateOfTitle}` : ''}.`
    : 'ההצעה נשמרה ולא נחסמה, כדי לאפשר בדיקה אנושית בהמשך.';

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h2>ההצעה נשלחה בהצלחה!</h2>
        <p>
          {isDuplicate
            ? 'ההצעה נשמרה בהצלחה וסומנה במערכת ככפילות אפשרית לבדיקה של הגורמים הרלוונטיים.'
            : 'הצעתך נקלטה במערכת IdeaForce ותועבר לבחינת הגורמים הרלוונטיים. תודה על תרומתך לשיפור היחידה.'}
        </p>

        {isDuplicate && (
          <div className="success-duplicate-note">
            <strong>סומן ככפילות אפשרית</strong>
            <span>{duplicateHint}</span>
          </div>
        )}

        {!emailSent && (
          <div className="success-duplicate-note">
            <strong>׳©׳™׳׳” ׳׳‘</strong>
            <span>
              ׳”׳”׳¦׳¢׳” ׳ ׳©׳׳¨׳” ׳‘׳”׳¦׳׳—׳”, ׳׳ ׳”׳׳™׳™׳ ׳׳׳ ׳”׳ ׳׳ ׳ ׳©׳׳—׳”.
              {successState.emailError ? ` ${successState.emailError}` : ''}
            </span>
          </div>
        )}

        <div className="success-buttons">
          <button className="success-primary-btn" onClick={() => navigate('/')}>
            חזרה למסך הבית
          </button>

          <button className="success-secondary-btn" onClick={() => navigate('/new-suggestion')}>
            הגשת הצעה נוספת
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuggestionSuccess;
