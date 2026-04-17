import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SoldierHome.css';

function SoldierHome() {
  const navigate = useNavigate();

  return (
    <div className="home-shell">
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
          <div className="hero-card-badge">מרכז חדשנות ושיפור מתמיד</div>
          <h2 className="home-title">ברוכים הבאים למערכת ההצעות המבצעית של הבסיס</h2>
          <p className="home-text">
            כאן ניתן להגיש הצעות לשיפור תהליכים, בטיחות, הדרכה, איכות והתייעלות,
            ולצפות בכל רגע מה מצב ההצעה ומה השתנה מאז ההגשה.
          </p>

          <div className="home-buttons">
            <button className="home-primary-btn" onClick={() => navigate('/new-suggestion')}>
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
        <p>מערכת פנימית לשימוש חיילי ומפקדי הבסיס בלבד.</p>
      </footer>
    </div>
  );
}

export default SoldierHome;
