import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import API_BASE_URL from '../config/api';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('הכל');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [duplicateDecision, setDuplicateDecision] = useState('not_checked');
  const [duplicateNote, setDuplicateNote] = useState('');
  const [committeeDecision, setCommitteeDecision] = useState(false);
  const [committeeDate, setCommitteeDate] = useState('');

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (!selectedSuggestion) {
      return;
    }

    // בכל פתיחת הצעה טוענים את מצב הכפילות האחרון כדי לאפשר המשך עבודה רציף.
    setDuplicateDecision(selectedSuggestion.duplicateReviewStatus || (selectedSuggestion.isDuplicate ? 'suspected' : 'not_checked'));
    setDuplicateNote(selectedSuggestion.duplicateReviewNote || '');
    setCommitteeDecision(Boolean(selectedSuggestion.displayInCommittee));
    setCommitteeDate(selectedSuggestion.committeeDate || '');
  }, [selectedSuggestion]);

  const formatDate = (value) => {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('he-IL');
    }

    return value;
  };

  const getLastUpdate = (suggestion) => {
    if (suggestion.history?.length) {
      return suggestion.history[suggestion.history.length - 1]?.date || suggestion.updatedAt || suggestion.date;
    }

    return suggestion.updatedAt || suggestion.date;
  };

  const getRelatedSuggestion = (suggestion) => {
    if (!suggestion?.duplicateOfId) {
      return null;
    }

    return suggestions.find((item) => item.id === suggestion.duplicateOfId) || null;
  };

  const openRelatedSuggestion = (suggestion) => {
    const relatedSuggestion = getRelatedSuggestion(suggestion);
    if (relatedSuggestion) {
      setSelectedSuggestion(relatedSuggestion);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם למחוק את ההצעה לצמיתות?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id && s._id !== id));
        setSelectedSuggestion(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        return;
      }

      const result = await res.json();
      const updatedSuggestion = result.suggestion;
      setSuggestions((prev) => prev.map((s) => (
        s.id === updatedSuggestion.id || s._id === updatedSuggestion._id ? updatedSuggestion : s
      )));

      if (selectedSuggestion && (selectedSuggestion.id === updatedSuggestion.id || selectedSuggestion._id === updatedSuggestion._id)) {
        setSelectedSuggestion(updatedSuggestion);
      }

      if (result.emailSent === false) {
        alert(`הסטטוס נשמר, אבל המייל לחייל לא נשלח.\n${result.emailError || ''}`.trim());
      } else if (result.emailSent === true) {
        alert('הסטטוס עודכן והמייל נשלח לחייל.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDuplicateReviewSave = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${id}/duplicate-review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: duplicateDecision,
          reviewNote: duplicateNote
        })
      });

      if (!res.ok) {
        return;
      }

      // כאן נשמרת החלטת המנהל על הכפילות כדי שהמערכת תישאר מוסברת ומתועדת.
      const updatedSuggestion = await res.json();
      setSuggestions((prev) => prev.map((s) => (
        s.id === updatedSuggestion.id || s._id === updatedSuggestion._id ? updatedSuggestion : s
      )));
      setSelectedSuggestion(updatedSuggestion);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommitteeSave = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${id}/committee`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayInCommittee: committeeDecision,
          committeeDate: committeeDecision ? committeeDate : ''
        })
      });

      if (!res.ok) {
        return;
      }

      // החלטת ועדת הייעול נשמרת בנפרד כדי שהמנהל יוכל לנהל הצגה לוועדה בלי לשנות סטטוס טיפול.
      const updatedSuggestion = await res.json();
      setSuggestions((prev) => prev.map((s) => (
        s.id === updatedSuggestion.id || s._id === updatedSuggestion._id ? updatedSuggestion : s
      )));
      setSelectedSuggestion(updatedSuggestion);
    } catch (error) {
      console.error(error);
    }
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
        return 'כפילות חשודה';
      default:
        return isDuplicate ? 'כפילות חשודה' : '-';
    }
  };

  const hasDuplicateState = (suggestion) => (
    suggestion?.isDuplicate || suggestion?.duplicateReviewStatus === 'not_duplicate'
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'מאושר':
        return 'green';
      case 'נדחה':
        return 'red';
      case 'בטיפול':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const summaryCards = useMemo(() => ([
    { label: 'סה"כ הצעות', value: suggestions.length, tone: 'neutral' },
    { label: 'בהמתנה', value: suggestions.filter((s) => s.status === 'בהמתנה').length, tone: 'gray' },
    { label: 'בטיפול', value: suggestions.filter((s) => s.status === 'בטיפול').length, tone: 'blue' },
    { label: 'כפילויות', value: suggestions.filter((s) => hasDuplicateState(s)).length, tone: 'gold' }
  ]), [suggestions]);

  const filteredSuggestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = suggestions.filter((suggestion) => {
      const matchesSearch = !normalizedSearch
        || suggestion.title?.toLowerCase().includes(normalizedSearch)
        || suggestion.soldier?.soldierName?.toLowerCase().includes(normalizedSearch)
        || suggestion.soldier?.fullName?.toLowerCase().includes(normalizedSearch)
        || suggestion.soldier?.idNumber?.includes(normalizedSearch)
        || suggestion.unit?.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'הכל' || suggestion.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // המיון נותן למנהל שליטה על הסדר ולא משאיר את המסך סטטי.
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '', 'he');
      }

      if (sortBy === 'updated') {
        return new Date(getLastUpdate(b)).getTime() - new Date(getLastUpdate(a)).getTime();
      }

      return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
    });

    return filtered;
  }, [suggestions, searchTerm, statusFilter, sortBy]);

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const buildExcelRows = (items) => items.map((suggestion) => ({
    'מספר הצעה': suggestion.id || '',
    'שם ההצעה': suggestion.title || '',
    'מגיש': suggestion.soldier?.fullName || suggestion.soldier?.soldierName || '',
    'תעודת זהות': suggestion.soldier?.idNumber || '',
    'יחידה': suggestion.unit || '',
    'תחום': suggestion.domain || suggestion.otherDomain || '',
    'סטטוס': suggestion.status || '',
    'כפילות': hasDuplicateState(suggestion) ? getDuplicateDecisionLabel(suggestion.duplicateReviewStatus, suggestion.isDuplicate) : 'לא',
    'תאריך ועדה': suggestion.committeeDate || '',
    'תאריך הגשה': formatDate(suggestion.date || suggestion.createdAt),
    'עדכון אחרון': formatDate(getLastUpdate(suggestion))
  }));

  const exportRowsToExcel = (rows, fileName) => {
    const headers = Object.keys(rows[0] || {});
    const tableHead = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
    const tableRows = rows.map((row) => (
      `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`
    )).join('');

    const workbookHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #cfd8e3; padding: 8px; text-align: right; }
            th { background: #e8eef7; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>${tableHead}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', workbookHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    saveAs(blob, `${fileName}.xls`);
  };

  const exportSuggestionToExcel = (suggestion) => {
    exportRowsToExcel(buildExcelRows([suggestion]), `IdeaForce_${suggestion.id}`);
  };

  const exportFilteredSuggestionsToExcel = () => {
    exportRowsToExcel(buildExcelRows(filteredSuggestions), 'IdeaForce_Suggestions');
  };

  const generateWordDocument = (suggestion) => {
    const createHebrewParagraph = (text, options = {}) => (
      new Paragraph({
        children: [new TextRun({ text, size: 24, font: 'Arial', ...options.textOptions })],
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        ...options
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'טופס הצעת ייעול - IdeaForce',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 300 }
          }),
          createHebrewParagraph(`מספר ההצעה: ${suggestion.id}`),
          createHebrewParagraph(`תאריך ההגשה: ${formatDate(suggestion.date || suggestion.createdAt)}`),
          createHebrewParagraph(`סטטוס נוכחי: ${suggestion.status}`, { spacing: { after: 300 } }),
          createHebrewParagraph('------------------------------------------------', { alignment: AlignmentType.CENTER }),
          createHebrewParagraph('פרטי המגיש:', { heading: HeadingLevel.HEADING_2 }),
          createHebrewParagraph(`שם: ${suggestion.soldier?.soldierName || suggestion.soldier?.fullName || ''}`),
          createHebrewParagraph(`ת"ז: ${suggestion.soldier?.idNumber || ''}`),
          createHebrewParagraph(`יחידה: ${suggestion.unit || ''} | גף: ${suggestion.gaf || ''}`, { spacing: { after: 300 } }),
          createHebrewParagraph('פרטי ההצעה:', { heading: HeadingLevel.HEADING_2 }),
          createHebrewParagraph('נושא:', { textOptions: { bold: true } }),
          createHebrewParagraph(suggestion.title || '', { spacing: { after: 150 } }),
          createHebrewParagraph('מצב קיים:', { textOptions: { bold: true } }),
          createHebrewParagraph(suggestion.currentState || '', { spacing: { after: 150 } }),
          createHebrewParagraph('ההצעה:', { textOptions: { bold: true } }),
          createHebrewParagraph(suggestion.proposal || '', { spacing: { after: 150 } }),
          createHebrewParagraph('תועלת צפויה:', { textOptions: { bold: true } }),
          createHebrewParagraph(suggestion.improvement || '', { spacing: { after: 300 } })
        ]
      }]
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `IdeaForce_${suggestion.id}.docx`);
    });
  };

  return (
    <div className="admin-shell">
      <header className="admin-hero">
        <div>
          <span className="admin-kicker">מרחב ניהולי</span>
          <h1>ניהול הצעות</h1>
          <p>תמונת מצב מהירה, מעבר נוח בין הצעות, וקבלת החלטות במקום אחד.</p>
        </div>

        <div className="header-actions">
          <button className="stats-btn" onClick={() => navigate('/admin/stats')}>
            מעבר לדשבורד
          </button>
          <button className="excel-btn" onClick={exportFilteredSuggestionsToExcel}>
            ייצוא לאקסל
          </button>
          <button className="logout-btn" onClick={() => navigate('/')}>
            יציאה
          </button>
        </div>
      </header>

      <section className="admin-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className={`summary-card ${card.tone}`}>
            <span className="summary-card-label">{card.label}</span>
            <strong className="summary-card-value">{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-filters-card">
        <input
          type="text"
          placeholder="חיפוש לפי כותרת, מגיש, תעודת זהות או יחידה"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search"
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-filter">
          <option value="הכל">כל הסטטוסים</option>
          <option value="בהמתנה">בהמתנה</option>
          <option value="בטיפול">בטיפול</option>
          <option value="מאושר">מאושר</option>
          <option value="נדחה">נדחה</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="admin-filter">
          <option value="newest">מיון: חדשות תחילה</option>
          <option value="updated">מיון: עדכון אחרון</option>
          <option value="title">מיון: כותרת א-ב</option>
        </select>

        <div className="results-pill">
          מוצגות <strong>{filteredSuggestions.length}</strong> הצעות
        </div>
      </section>

      <section className="admin-list-shell">
        {loading ? (
          <p className="admin-empty">טוען נתונים...</p>
        ) : filteredSuggestions.length === 0 ? (
          <p className="admin-empty">לא נמצאו הצעות שתואמות לחיפוש ולסינון שנבחרו.</p>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <article key={suggestion.id || suggestion._id} className="admin-suggestion-card">
              <div className="card-header-row">
                <div>
                  <span className="card-code">#{suggestion.id}</span>
                  <h3>{suggestion.title}</h3>
                </div>

                <div className="card-badges">
                  {hasDuplicateState(suggestion) && (
                    <span className="duplicate-badge">
                      <span className="duplicate-icon">⚠</span>
                      {getDuplicateDecisionLabel(suggestion.duplicateReviewStatus, suggestion.isDuplicate)}
                    </span>
                  )}

                  <span className={`status-badge ${getStatusClass(suggestion.status)}`}>
                    {suggestion.status}
                  </span>
                </div>
              </div>

              <div className="admin-card-grid">
                <div className="admin-meta-box">
                  <span className="meta-label">מגיש</span>
                  <span className="meta-value">{suggestion.soldier?.fullName || suggestion.soldier?.soldierName || '-'}</span>
                </div>
                <div className="admin-meta-box">
                  <span className="meta-label">תעודת זהות</span>
                  <span className="meta-value">{suggestion.soldier?.idNumber || '-'}</span>
                </div>
                <div className="admin-meta-box">
                  <span className="meta-label">יחידה</span>
                  <span className="meta-value">{suggestion.unit || '-'}</span>
                </div>
                <div className="admin-meta-box">
                  <span className="meta-label">עדכון אחרון</span>
                  <span className="meta-value">{formatDate(getLastUpdate(suggestion))}</span>
                </div>
                <div className="admin-meta-box">
                  <span className="meta-label">ועדת ייעול</span>
                  <span className="meta-value">{suggestion.displayInCommittee ? 'תוצג בוועדה' : 'לא תוצג בוועדה'}</span>
                </div>
                <div className="admin-meta-box">
                  <span className="meta-label">תאריך ועדה</span>
                  <span className="meta-value">{suggestion.committeeDate || '-'}</span>
                </div>
              </div>

              <div className="admin-card-footer">
                <button className="card-action primary" onClick={() => setSelectedSuggestion(suggestion)}>
                  צפייה וניהול
                </button>
                <button className="card-action secondary" onClick={() => generateWordDocument(suggestion)}>
                  Word
                </button>
                <button className="card-action secondary" onClick={() => exportSuggestionToExcel(suggestion)}>
                  Excel
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {selectedSuggestion && (
        <div className="modal-overlay" onClick={() => setSelectedSuggestion(null)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSuggestion(null)}>×</button>

            <div className="modal-header">
              <div>
                <span className="card-code">#{selectedSuggestion.id}</span>
                <h2>{selectedSuggestion.title}</h2>
                <p>הוגשה בתאריך {formatDate(selectedSuggestion.date || selectedSuggestion.createdAt)}</p>
              </div>
              <span className={`status-badge ${getStatusClass(selectedSuggestion.status)}`}>
                {selectedSuggestion.status}
              </span>
            </div>

            <div className="modal-grid">
              <div className="modal-section">
                <div className="detail-card">
                  <h3>פרטי ההצעה</h3>
                  <div className="detail-item"><label>מצב קיים</label><p>{selectedSuggestion.currentState || '-'}</p></div>
                  <div className="detail-item"><label>ההצעה</label><p>{selectedSuggestion.proposal || '-'}</p></div>
                  <div className="detail-item"><label>שיפור צפוי</label><p>{selectedSuggestion.improvement || '-'}</p></div>
                </div>

                <div className="detail-card">
                  <h3>היסטוריית סטטוסים</h3>
                  {selectedSuggestion.history?.length ? (
                    selectedSuggestion.history.map((item, index) => (
                      <div className="history-row" key={`${item.date}-${index}`}>
                        <strong>{item.status || '-'}</strong>
                        <span>{formatDate(item.date)}</span>
                        <p>{item.note || 'ללא הערה'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="admin-empty compact">אין היסטוריה להצגה.</p>
                  )}
                </div>
              </div>

              <aside className="modal-sidebar">
                <div className="sidebar-box">
                  <h3>פרטי המגיש</h3>
                  <p><strong>שם:</strong> {selectedSuggestion.soldier?.fullName || selectedSuggestion.soldier?.soldierName || '-'}</p>
                  <p><strong>ת"ז:</strong> {selectedSuggestion.soldier?.idNumber || '-'}</p>
                  <p><strong>טלפון:</strong> {selectedSuggestion.soldier?.phone || '-'}</p>
                  <p><strong>יחידה:</strong> {selectedSuggestion.unit || '-'}</p>
                  <p><strong>גף:</strong> {selectedSuggestion.gaf || '-'}</p>
                </div>

                {hasDuplicateState(selectedSuggestion) && (
                  <div className="sidebar-box duplicate-box">
                    <h3>ניהול כפילויות</h3>
                    <div className="duplicate-summary-row">
                      <span className="duplicate-badge">
                        <span className="duplicate-icon">⚠</span>
                        {getDuplicateDecisionLabel(selectedSuggestion.duplicateReviewStatus, selectedSuggestion.isDuplicate)}
                      </span>
                    </div>
                    <p><strong>דומה להצעה מספר:</strong> {selectedSuggestion.duplicateOfId || '-'}</p>
                    <p><strong>כותרת הצעה דומה:</strong> {selectedSuggestion.duplicateOfTitle || '-'}</p>

                    {getRelatedSuggestion(selectedSuggestion) && (
                      <button className="related-suggestion-btn" onClick={() => openRelatedSuggestion(selectedSuggestion)}>
                        פתח הצעה קשורה
                      </button>
                    )}

                    <select
                      value={duplicateDecision}
                      onChange={(e) => setDuplicateDecision(e.target.value)}
                      className="modal-status-select"
                    >
                      <option value="suspected">כפילות חשודה</option>
                      <option value="confirmed_duplicate">כפילות מאושרת</option>
                      <option value="improved_version">גרסה משופרת</option>
                      <option value="not_duplicate">לא כפילות</option>
                    </select>

                    <textarea
                      className="duplicate-note-input"
                      rows="4"
                      value={duplicateNote}
                      onChange={(e) => setDuplicateNote(e.target.value)}
                      placeholder="הערת מנהל לגבי ההחלטה"
                    />

                    <button className="duplicate-save-btn" onClick={() => handleDuplicateReviewSave(selectedSuggestion.id || selectedSuggestion._id)}>
                      שמירת החלטת כפילות
                    </button>
                  </div>
                )}

                <div className="sidebar-box action-box">
                  <h3>פעולות ניהול</h3>
                  <select
                    value={selectedSuggestion.status}
                    onChange={(e) => handleStatusChange(selectedSuggestion.id || selectedSuggestion._id, e.target.value)}
                    className="modal-status-select"
                  >
                    <option value="בהמתנה">בהמתנה</option>
                    <option value="בטיפול">בטיפול</option>
                    <option value="מאושר">מאושר</option>
                    <option value="נדחה">נדחה</option>
                  </select>

                  <div className="committee-box">
                    <span className="committee-label">הצגה בוועדת הצעת ייעול</span>
                    <div className="committee-actions">
                      <button
                        type="button"
                        className={`committee-toggle ${committeeDecision ? 'active' : ''}`}
                        onClick={() => setCommitteeDecision(true)}
                      >
                        תוצג בוועדה
                      </button>
                      <button
                        type="button"
                        className={`committee-toggle ${!committeeDecision ? 'active off' : ''}`}
                        onClick={() => setCommitteeDecision(false)}
                      >
                        לא תוצג
                      </button>
                    </div>
                    {committeeDecision && (
                      <>
                        {/* תאריך הוועדה נשמר על ההצעה כדי לאפשר אחר כך סינון נוח לפי ועדה קרובה או תאריך מסוים. */}
                        <label className="committee-date-label">
                          תאריך ועדה
                          <input
                            type="date"
                            className="committee-date-input"
                            value={committeeDate}
                            onChange={(e) => setCommitteeDate(e.target.value)}
                          />
                        </label>
                      </>
                    )}
                    <button
                      type="button"
                      className="committee-save-btn"
                      onClick={() => handleCommitteeSave(selectedSuggestion.id || selectedSuggestion._id)}
                    >
                      שמירת החלטת ועדה
                    </button>
                  </div>

                  <button className="word-export-btn" onClick={() => generateWordDocument(selectedSuggestion)}>
                    ייצוא ל-Word
                  </button>
                  <button className="excel-export-btn" onClick={() => exportSuggestionToExcel(selectedSuggestion)}>
                    ייצוא ל-Excel
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(selectedSuggestion.id || selectedSuggestion._id)}>
                    מחק הצעה
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
