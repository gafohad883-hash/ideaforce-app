import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import AppToast from '../components/AppToast';
import '../styles/SoldierHome.css';

// מסך הבית של החייל שמרכז כניסה להגשת הצעה, צפייה בהצעות ופנייה למנהלת המערכת.
function SoldierHome() {
  const navigate = useNavigate();
  const [showBlamasModal, setShowBlamasModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: '',
    phone: '',
    squadron: '',
    notes: ''
  });
  const [sendingContact, setSendingContact] = useState(false);
  const [toast, setToast] = useState({ message: '', tone: 'info' });

  // פותח הודעה על בלמ"ס לפני מעבר למסך הגשת הצעה חדשה.
  const handleOpenNewSuggestion = () => {
    setShowBlamasModal(true);
  };

  // ממשיך למסך ההגשה רק אחרי שהחייל ראה את הודעת הסיווג.
  const handleContinueToSuggestion = () => {
    setShowBlamasModal(false);
    navigate('/new-suggestion');
  };

  // מעדכן שדה יחיד בטופס יצירת הקשר בלי לשכפל לוגיקה לכל קלט.
  const handleContactChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  // שולח פנייה למנהלת המערכת ומציג הודעה מעוצבת במקום alert רגיל.
  const handleSubmitContact = async (event) => {
    event.preventDefault();

    if (!contactForm.fullName.trim() || !contactForm.phone.trim() || !contactForm.squadron.trim() || !contactForm.notes.trim()) {
      setToast({ message: 'נא למלא שם חייל, טלפון, טייסת והערות.', tone: 'error' });
      return;
    }

    setSendingContact(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contact-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to send');
      }

      setToast({ message: 'הפנייה נשלחה למנהלת המערכת.', tone: 'success' });
      setContactForm({ fullName: '', phone: '', squadron: '', notes: '' });
      setShowContactModal(false);
    } catch (error) {
      console.error(error);
      setToast({ message: `לא הצלחנו לשלוח את הפנייה כרגע. ${error.message || ''}`.trim(), tone: 'error' });
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <div className="home-shell">
      <AppToast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'info' })} />
      <div className="home-top-bar">
        <div className="home-emblem icon-only">
          <div className="emblem-logo-frame">
            <img src="/assets/base-logo.jpeg" alt="סמל הבסיס" className="real-emblem" />
          </div>
        </div>

        <div className="home-emblem icon-only">
          <div className="emblem-logo-frame">
            <img src="/assets/squadron-logo.jpeg" alt="סמל הטייסת" className="real-emblem" />
          </div>
        </div>
      </div>

      <header className="home-hero">
        <span className="home-kicker">מערכת ארגונית פנימית</span>
        <h1>IdeaForce</h1>
        <p className="home-subtitle">
          מערכת הצעות ייעול המאפשרת לחיילים להגיש רעיונות, לעקוב אחרי הטיפול בהם,
          ולמפקדים לנתח מגמות ולקבל החלטות.
        </p>
      </header>

      <main className="home-main">
        <section className="home-hero-card">
          <div className="hero-card-badge">מפותח על ידי גף אוה"ד תחזוקה ביסל"א</div>
          <h2 className="home-title">ברוכים הבאים למערכת הגשת הצעות ייעול</h2>
          <p className="home-text">
            כאן ניתן להגיש הצעות לשיפור תהליכים, בטיחות, הדרכה, איכות והתייעלות,
            ולצפות בכל רגע מה מצב ההצעה ומה השתנה מאז ההגשה.
          </p>

          <div className="home-buttons">
            <button className="home-primary-btn" onClick={handleOpenNewSuggestion}>
              שליחת הצעת ייעול חדשה
            </button>

            <button className="home-secondary-btn" onClick={() => navigate('/my-suggestions')}>
              צפייה בהצעות שלי
            </button>
          </div>
        </section>

        <section className="home-side-panel">
          <div className="side-panel-card">
            <span className="side-panel-title">מה אפשר לעשות כאן?</span>
            <ul className="side-panel-list">
              <li>להגיש הצעה חדשה בצורה מסודרת</li>
              <li>לעקוב אחרי שינויי סטטוס בזמן אמת</li>
              <li>לראות אם ניתנה הערה או החלטה ניהולית</li>
            </ul>
          </div>

          <div className="side-panel-card highlight">
            <span className="side-panel-title">מטרה מערכתית</span>
            <p>
              להפוך רעיונות מהשטח לכלי עבודה אמיתי, עם שקיפות, מעקב ותיעוד לאורך כל הדרך.
            </p>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <button className="contact-manager-btn" onClick={() => setShowContactModal(true)}>
          יצירת קשר עם מנהל המערכת
        </button>
        <p>מערכת פנימית לשימוש חיילי ומפקדי הבסיס בלבד.</p>
      </footer>

      {showBlamasModal && (
        <div className="home-modal-overlay" onClick={() => setShowBlamasModal(false)}>
          <div className="home-modal-card compact" onClick={(event) => event.stopPropagation()}>
            <button className="home-modal-close" onClick={() => setShowBlamasModal(false)}>×</button>
            <h3>הגשת הצעה חדשה</h3>
            <p>
              במערכת זו מעלים רק הצעות בסיווג בלמ&quot;ס בלבד.
              הצעות בסיווג אחר יש להגיש בערוץ הבסיסי הייעודי לכך.
            </p>
            <div className="home-modal-actions">
              <button className="home-modal-primary" onClick={handleContinueToSuggestion}>
                הבנתי, המשך להגשה
              </button>
              <button className="home-modal-secondary" onClick={() => setShowBlamasModal(false)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="home-modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="home-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="home-modal-close" onClick={() => setShowContactModal(false)}>×</button>
            <h3>יצירת קשר עם מנהל המערכת</h3>
            <form className="contact-form" onSubmit={handleSubmitContact}>
              <label>
                שם החייל
                <input
                  type="text"
                  value={contactForm.fullName}
                  onChange={(event) => handleContactChange('fullName', event.target.value)}
                />
              </label>

              <label>
                טלפון
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={(event) => handleContactChange('phone', event.target.value)}
                />
              </label>

              <label>
                טייסת
                <input
                  type="text"
                  value={contactForm.squadron}
                  onChange={(event) => handleContactChange('squadron', event.target.value)}
                />
              </label>

              <label>
                הערות
                <textarea
                  rows="5"
                  value={contactForm.notes}
                  onChange={(event) => handleContactChange('notes', event.target.value)}
                />
              </label>

              <div className="home-modal-actions">
                <button type="submit" className="home-modal-primary" disabled={sendingContact}>
                  {sendingContact ? 'שולח...' : 'שלח פנייה'}
                </button>
                <button type="button" className="home-modal-secondary" onClick={() => setShowContactModal(false)}>
                  סגור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SoldierHome;
