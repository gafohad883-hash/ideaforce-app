import React from 'react';

// רכיב הודעה קטן ואחיד שמחליף alert ומציג הצלחה, שגיאה או מידע בצורה נעימה יותר.
function AppToast({ message, tone = 'info', onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`app-toast ${tone}`}>
      <span>{message}</span>
      <button type="button" className="app-toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default AppToast;
