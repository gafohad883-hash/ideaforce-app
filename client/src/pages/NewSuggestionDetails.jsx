import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import '../styles/NewSuggestionDetails.css';

function NewSuggestionDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const soldierData = location.state?.soldier;

  // אם מנסים להיכנס ישירות לדף בלי למלא פרטים קודם
  if (!soldierData) {
    navigate('/');
  }

  const [formData, setFormData] = useState({
    classification: '',
    title: '',
    currentState: '',
    proposal: '',
    improvement: '',
    domain: '',
    otherDomain: '',
    unit: '',
    gaf: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecretModal, setShowSecretModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // טיפול בסיווג סודי
    if (name === 'classification' && value === 'סודי') {
      setShowSecretModal(true);
      setFormData({ ...formData, classification: '' });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    // בדיקות חובה
    if (!formData.title || !formData.currentState || !formData.proposal || !formData.domain || !formData.unit) {
      setError('נא למלא את כל שדות החובה');
      return;
    }
    // אם בחר "אחר" אבל לא פירט
    if (formData.domain === 'אחר' && !formData.otherDomain) {
      setError('נא לפרט את התחום האחר');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      soldier: soldierData
    };

    try {
      const response = await fetch(`${API_BASE_URL}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        navigate('/success');
      } else if (response.status === 409) {
        // --- כאן תופסים את הכפילות! ---
        setError('שגיאה: קיימת כבר הצעה עם כותרת זהה במערכת. אנא בחר כותרת אחרת.');
      } else {
        const errData = await response.json();
        setError('שגיאה בשמירה: ' + (errData.error || 'נסה שנית'));
      }
    } catch (err) {
      setError('שגיאת תקשורת מול השרת.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="details-container">
      <header className="details-header">
        <h2>פרטי ההצעה</h2>
        <p>שלב 2 מתוך 2</p>
      </header>

      <div className="details-card">
        <div className="form-group">
          <label>סיווג ההצעה</label>
          <select name="classification" value={formData.classification} onChange={handleChange}>
            <option value="">בחר סיווג...</option>
            <option value="בלמ״ס">בלמ״ס</option>
            <option value="שמור">שמור</option>
            <option value="סודי">סודי</option>
          </select>
        </div>

        <div className="form-group">
          <label>שם ההצעה</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="למשל: ייעול תהליך בוקר בגף" />
        </div>

        <div className="form-group">
          <label>תיאור המצב הקיים</label>
          <textarea name="currentState" rows="3" value={formData.currentState} onChange={handleChange} placeholder="מה קורה היום ומה הבעיה..." />
        </div>

        <div className="form-group">
          <label>מה ההצעה?</label>
          <textarea name="proposal" rows="3" value={formData.proposal} onChange={handleChange} placeholder="מה הפתרון שאתה מציע..." />
        </div>

        <div className="form-group">
          <label>מה זה בא לשפר?</label>
          <textarea name="improvement" rows="2" value={formData.improvement} onChange={handleChange} placeholder="זמן, כסף, בטיחות..." />
        </div>

        <div className="row-group">
          <div className="form-group half">
            <label>תחום</label>
            <select name="domain" value={formData.domain} onChange={handleChange}>
              <option value="">בחר...</option>
              <option value="הדרכה">הדרכה</option>
              <option value="איכות">איכות</option>
              <option value="אחזקה">אחזקה</option>
              <option value="מנהלתי">מנהלתי</option>
              <option value="בטיחותי">בטיחותי</option>
              <option value="אחר">אחר</option>
            </select>
          </div>
          
          <div className="form-group half">
            <label>יחידה</label>
            <select name="unit" value={formData.unit} onChange={handleChange}>
              <option value="">בחר...</option>
              <option value="תחזוקה">תחזוקה</option>
              <option value="ירוט 820">ירוט 820</option>
              <option value="הדרכה ותעופה">הדרכה ותעופה</option>
              <option value="מנהלה">מנהלה</option>
              <option value="גדוד 533">גדוד 533</option>
              <option value="מגמת פיקוד">מגמת פיקוד</option>
              <option value="מגמת יסודות">מגמת יסודות</option>
              <option value="לשכת הבסיס">לשכת הבסיס</option>
              <option value="מפקדת המחנה">מפקדת המחנה</option>
            </select>
          </div>
        </div>

        {formData.domain === 'אחר' && (
            <div className="form-group">
                <label>פרט את התחום האחר:</label>
                <input type="text" name="otherDomain" value={formData.otherDomain} onChange={handleChange} placeholder="למשל: רפואה, לוגיסטיקה..." />
            </div>
        )}

        <div className="form-group">
          <label>גף / מחלקה</label>
          <input type="text" name="gaf" value={formData.gaf} onChange={handleChange} placeholder="למשל: גף אוהד" />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="details-buttons">
          <button className="back-btn" onClick={() => navigate(-1)}>חזרה</button>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'שולח...' : 'שליחת הצעה'}
          </button>
        </div>
      </div>

      {showSecretModal && (
        <div className="secret-overlay">
          <div className="secret-modal">
            <h3>הצעה מסווגת – סודי</h3>
            <p>
              במידה והצעת הייעול הינה סודית יש לפנות למפקדים להמשך תהליך הגשת
              ההצעה.
            </p>
            <button
              type="button"
              className="secret-close-btn"
              onClick={() => setShowSecretModal(false)}
            >
              הבנתי
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewSuggestionDetails;