import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/SoldierSuggestionDetails.css';

function SoldierSuggestionDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const suggestion = location.state?.suggestion;

  if (!suggestion) {
    navigate('/my-suggestions');
    return null;
  }

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';

    const parsedDate = new Date(dateValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleString('he-IL');
    }

    return dateValue;
  };

  const getLastStatusDate = () => {
    if (suggestion.history && suggestion.history.length > 0) {
      return suggestion.history[suggestion.history.length - 1]?.date || suggestion.updatedAt || suggestion.date;
    }
    return suggestion.updatedAt || suggestion.date;
  };

  const getDuplicateDecisionLabel = (reviewStatus, isDuplicate) => {
    switch (reviewStatus) {
      case 'confirmed_duplicate':
        return 'כפילות מאושרת';
      case 'improved_version':
        return 'גרסה משופרת';
      case 'not_duplicate':
        return 'לא כפילות';
      case 'suspected':
        return 'חשודה לכפילות';
      default:
        return isDuplicate ? 'חשודה לכפילות' : '-';
    }
  };

  return (
    <div className="soldier-details-container">
      <header className="soldier-details-header">
        <span className="details-kicker">מעקב אישי</span>
        <h2>פרטי ההצעה</h2>
        <p>כל המידע על ההצעה, השינויים שבוצעו בה וההערות שנרשמו לאורך הדרך.</p>
      </header>

      <div className="soldier-details-card">
        <div className="details-summary-grid">
          <div className="summary-box">
            <span className="summary-label">מספר ההצעה</span>
            <span className="summary-value">{suggestion.id || '-'}</span>
          </div>

          <div className="summary-box accent-status">
            <span className="summary-label">סטטוס נוכחי</span>
            <span className="summary-value">{suggestion.status || '-'}</span>
          </div>

          <div className="summary-box">
            <span className="summary-label">תאריך העלאה</span>
            <span className="summary-value">{formatDate(suggestion.date)}</span>
          </div>

          <div className="summary-box">
            <span className="summary-label">תאריך שינוי סטטוס אחרון</span>
            <span className="summary-value">{formatDate(getLastStatusDate())}</span>
          </div>
        </div>

        <section className="details-section">
          <h3>פרטי ההצעה</h3>

          <div className="details-row">
            <strong>שם ההצעה:</strong>
            <span>{suggestion.title || '-'}</span>
          </div>

          <div className="details-row">
            <strong>סיווג:</strong>
            <span>{suggestion.classification || 'בלמ"ס'}</span>
          </div>

          <div className="details-row">
            <strong>תחום:</strong>
            <span>{suggestion.domain || suggestion.otherDomain || '-'}</span>
          </div>

          <div className="details-row">
            <strong>יחידה:</strong>
            <span>{suggestion.unit || '-'}</span>
          </div>

          <div className="details-row">
            <strong>גף / מחלקה:</strong>
            <span>{suggestion.gaf || '-'}</span>
          </div>
        </section>

        {(suggestion.isDuplicate || suggestion.duplicateReviewStatus === 'not_duplicate') && (
          <section className="details-section">
            <h3>מידע על כפילות</h3>
            <div className="details-block duplicate-details-note">
              <strong>סטטוס כפילות:</strong>
              <p>
                מצב מנהל: {getDuplicateDecisionLabel(suggestion.duplicateReviewStatus, suggestion.isDuplicate)}.
                {suggestion.duplicateOfId ? ` ייתכן קשר להצעה ${suggestion.duplicateOfId}.` : ''}
                {suggestion.duplicateReviewNote ? ` הערת מנהל: ${suggestion.duplicateReviewNote}` : ''}
              </p>
            </div>
          </section>
        )}

        <section className="details-section">
          <h3>תוכן ההצעה</h3>

          <div className="details-block">
            <strong>תיאור המצב הקיים:</strong>
            <p>{suggestion.currentState || '-'}</p>
          </div>

          <div className="details-block">
            <strong>מה ההצעה?</strong>
            <p>{suggestion.proposal || '-'}</p>
          </div>

          <div className="details-block">
            <strong>מה זה בא לשפר?</strong>
            <p>{suggestion.improvement || '-'}</p>
          </div>
        </section>

        <section className="details-section details-history">
          <h3>היסטוריית סטטוסים</h3>

          {suggestion.history && suggestion.history.length > 0 ? (
            suggestion.history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-item-row">
                  <strong>סטטוס:</strong>
                  <span>{item.status || '-'}</span>
                </div>
                <div className="history-item-row">
                  <strong>תאריך:</strong>
                  <span>{formatDate(item.date)}</span>
                </div>
                <div className="history-item-row note-row">
                  <strong>הערה:</strong>
                  <span>{item.note || 'לא נרשמה הערה'}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-history">אין היסטוריית סטטוסים להצגה.</p>
          )}
        </section>

        <div className="details-actions">
          <button onClick={() => navigate('/my-suggestions')}>חזרה לרשימת ההצעות</button>
        </div>
      </div>
    </div>
  );
}

export default SoldierSuggestionDetails;
