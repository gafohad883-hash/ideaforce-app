import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import '../styles/SoldierSuggestions.css';

function SoldierSuggestions() {
  const navigate = useNavigate();
  const [inputId, setInputId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [titleSearch, setTitleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('הכל');
  const [domainFilter, setDomainFilter] = useState('הכל');
  const [sortBy, setSortBy] = useState('updated_desc');

  const handleSearch = async () => {
    if (inputId.length !== 9) {
      alert('נא להזין תעודת זהות תקינה (9 ספרות)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions`);
      if (res.ok) {
        const allData = await res.json();

        // מסנן רק את ההצעות של החייל שהזין תעודת זהות.
        const myData = allData.filter((s) => {
          const savedId = s.soldier?.idNumber || s.soldier?.personalNumber || '';
          return savedId.toString() === inputId.toString();
        });

        setSuggestions(myData);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'מאושר':
        return 'status-green';
      case 'נדחה':
        return 'status-red';
      case 'בטיפול':
        return 'status-blue';
      default:
        return 'status-gray';
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const parsedDate = new Date(dateValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleString('he-IL');
    }
    return dateValue;
  };

  const getLastUpdateDate = (item) => {
    if (item.history && item.history.length > 0) {
      return item.history[item.history.length - 1]?.date || item.updatedAt || item.date;
    }
    return item.updatedAt || item.date;
  };

  const domainOptions = useMemo(() => {
    const domains = new Set(
      suggestions
        .map((item) => item.domain || item.otherDomain)
        .filter(Boolean)
    );

    return ['הכל', ...Array.from(domains)];
  }, [suggestions]);

  const filteredSuggestions = useMemo(() => {
    let result = [...suggestions];

    if (titleSearch.trim()) {
      result = result.filter((item) => item.title?.toLowerCase().includes(titleSearch.trim().toLowerCase()));
    }

    if (statusFilter !== 'הכל') {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (domainFilter !== 'הכל') {
      result = result.filter((item) => (item.domain || item.otherDomain) === domainFilter);
    }

    // המיון נותן לחייל שליטה על הרשימה במקום להציג לו סדר קבוע שלא תמיד עוזר.
    result.sort((a, b) => {
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '', 'he');
      }

      if (sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '', 'he');
      }

      const dateA = new Date(getLastUpdateDate(a));
      const dateB = new Date(getLastUpdateDate(b));
      const safeA = Number.isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const safeB = Number.isNaN(dateB.getTime()) ? 0 : dateB.getTime();

      return sortBy === 'updated_asc' ? safeA - safeB : safeB - safeA;
    });

    return result;
  }, [suggestions, titleSearch, statusFilter, domainFilter, sortBy]);

  const openSuggestionDetails = (item) => {
    navigate('/my-suggestions/details', { state: { suggestion: item } });
  };

  return (
    <div className="mysug-shell">
      <header className="mysug-header">
        <span className="mysug-kicker">מרחב החייל</span>
        <h2>ההצעות שלי</h2>
        <p>חיפוש, סינון ומעקב אחר כל ההצעות שהוגשו.</p>
      </header>

      <div className="mysug-content">
        <section className="lookup-card">
          <div className="lookup-card-text">
            <h3>איתור ההצעות האישיות</h3>
            <p>הזן תעודת זהות כדי לראות רק את ההצעות שלך ולעקוב אחר השינויים שבוצעו בהן.</p>
          </div>

          <div className="search-box-row">
            <input
              type="number"
              placeholder="תעודת זהות (9 ספרות)"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'טוען...' : 'הצג הצעות'}
            </button>
          </div>
        </section>

        {hasSearched && (
          <>
            <section className="filters-card">
              <div className="filters-grid">
                <input
                  type="text"
                  placeholder="חיפוש לפי כותרת"
                  value={titleSearch}
                  onChange={(e) => setTitleSearch(e.target.value)}
                />

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="הכל">כל הסטטוסים</option>
                  <option value="בהמתנה">בהמתנה</option>
                  <option value="בטיפול">בטיפול</option>
                  <option value="מאושר">מאושר</option>
                  <option value="נדחה">נדחה</option>
                </select>

                <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
                  {domainOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="updated_desc">מיון: עדכון אחרון - חדש לישן</option>
                  <option value="updated_asc">מיון: עדכון אחרון - ישן לחדש</option>
                  <option value="title_asc">מיון: כותרת א-ב</option>
                  <option value="status">מיון: לפי סטטוס</option>
                </select>
              </div>
              <div className="results-summary">
                נמצאו <strong>{filteredSuggestions.length}</strong> הצעות תואמות
              </div>
            </section>

            <section className="suggestions-list">
              {filteredSuggestions.length === 0 ? (
                <p className="no-data">לא נמצאו הצעות שתואמות לחיפוש ולסינון שנבחרו.</p>
              ) : (
                filteredSuggestions.map((item) => (
                  <article
                    key={item._id || item.id}
                    className="suggestion-card-mini"
                    onClick={() => openSuggestionDetails(item)}
                  >
                    <div className="card-top">
                      <div className="card-top-main">
                        <span className="card-id">#{item.id}</span>
                        <h3>{item.title}</h3>
                      </div>

                      <div className="card-tags">
                        {item.isDuplicate && <span className="duplicate-badge">כפילות אפשרית</span>}
                        <span className={`card-status ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <span className="meta-label">תחום</span>
                        <span className="meta-value">{item.domain || item.otherDomain || '-'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">יחידה</span>
                        <span className="meta-value">{item.unit || '-'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">תאריך הגשה</span>
                        <span className="meta-value">{formatDate(item.date)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">עדכון אחרון</span>
                        <span className="meta-value">{formatDate(getLastUpdateDate(item))}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className="card-footer-text">לחץ לצפייה מלאה בפרטי ההצעה והיסטוריית הסטטוסים</span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}

        <button className="back-home-btn" onClick={() => navigate('/')}>
          חזרה למסך הבית
        </button>
      </div>
    </div>
  );
}

export default SoldierSuggestions;
