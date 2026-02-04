import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NewSuggestion.css';

function NewSuggestion() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '', // ת"ז
    phone: '',
    email: '',    // מייל
    rank: '',
    serviceType: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    // ולידציה
    if (!formData.fullName || !formData.idNumber || !formData.phone || !formData.rank || !formData.serviceType || !formData.email) {
      setError('יש למלא את כל השדות');
      return;
    }
    if (formData.idNumber.length !== 9) {
      setError('תעודת זהות חייבת להכיל 9 ספרות');
      return;
    }
    if (formData.phone.length !== 10) {
      setError('מספר נייד חייב להכיל 10 ספרות');
      return;
    }
    // בדיקת תקינות מייל בסיסית
    if (!formData.email.includes('@')) {
      setError('כתובת אימייל לא תקינה');
      return;
    }

    navigate('/new-suggestion-details', { state: { soldier: formData } });
  };

  return (
    <div className="form-page-container">
      <header className="form-header">
        <h2>פרטי המגיש</h2>
        <p>שלב 1 מתוך 2</p>
      </header>

      <div className="form-card">
        <div className="form-group">
          <label>שם מלא</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="ישראל ישראלי" />
        </div>

        <div className="form-group">
          <label>תעודת זהות (9 ספרות)</label>
          <input type="number" name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="123456789" />
        </div>

        <div className="form-group">
          <label>טלפון נייד</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0501234567" />
        </div>

        <div className="form-group">
          <label>כתובת אימייל (לעדכונים)</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@gmail.com" />
        </div>

        <div className="form-group">
          <label>דרגה</label>
          <select name="rank" value={formData.rank} onChange={handleChange}>
            <option value="">בחר דרגה...</option>
            <optgroup label="חוגרים">
                <option value="טוראי">טוראי</option>
                <option value="רב״ט">רב״ט</option>
                <option value="סמל">סמל</option>
                <option value="סמ״ר">סמ״ר</option>
            </optgroup>
            <optgroup label="נגדים">
                <option value="רס״ל">רס״ל</option>
                <option value="רס״ר">רס״ר</option>
                <option value="רס״מ">רס״מ</option>
                <option value="רס״ב">רס״ב</option>
                <option value="רנ״ג">רנ״ג</option>
            </optgroup>
            <optgroup label="קצינים">
                <option value="סג״מ">סג״מ</option>
                <option value="סגן">סגן</option>
                <option value="סרן">סרן</option>
                <option value="רס״ן">רס״ן</option>
            </optgroup>
            <option value="אע״צ">אע״צ</option>
          </select>
        </div>

        <div className="form-group">
          <label>סוג שירות</label>
          <select name="serviceType" value={formData.serviceType} onChange={handleChange}>
            <option value="">בחר סוג שירות...</option>
            <option value="חובה">חובה</option>
            <option value="קבע">קבע</option>
            <option value="מילואים">מילואים</option>
            <option value="אזרח עובד צה״ל">אזרח עובד צה״ל</option>
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="form-actions">
          <button className="back-btn" onClick={() => navigate('/')}>ביטול</button>
          <button className="next-btn" onClick={handleNext}>המשך לשלב הבא</button>
        </div>
      </div>
    </div>
  );
}

export default NewSuggestion;