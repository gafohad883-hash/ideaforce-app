import React, { useEffect, useState } from 'react';
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
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [duplicateDecision, setDuplicateDecision] = useState('not_checked');
  const [duplicateNote, setDuplicateNote] = useState('');

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

    // בכל פתיחה של הצעה נטען את מצב הכפילות האחרון כדי שהמנהל יוכל להמשיך מאותה נקודה.
    setDuplicateDecision(selectedSuggestion.duplicateReviewStatus || (selectedSuggestion.isDuplicate ? 'suspected' : 'not_checked'));
    setDuplicateNote(selectedSuggestion.duplicateReviewNote || '');
  }, [selectedSuggestion]);

  const getRelatedSuggestion = (suggestion) => {
    if (!suggestion?.duplicateOfId) {
      return null;
    }

    // מאתר את ההצעה המקושרת כדי לאפשר מעבר ישיר בין ההצעה הנוכחית להצעה הדומה לה.
    return suggestions.find((item) => item.id === suggestion.duplicateOfId) || null;
  };

  const openRelatedSuggestion = (suggestion) => {
    const relatedSuggestion = getRelatedSuggestion(suggestion);
    if (relatedSuggestion) {
      setSelectedSuggestion(relatedSuggestion);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם את בטוחה שברצונך למחוק את ההצעה לצמיתות?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        setSelectedSuggestion(null);
        alert('ההצעה נמחקה.');
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

      if (res.ok) {
        setSuggestions((prev) => prev.map((s) => (
          s.id === id || s._id === id ? { ...s, status: newStatus } : s
        )));

        if (selectedSuggestion && (selectedSuggestion.id === id || selectedSuggestion._id === id)) {
          setSelectedSuggestion((prev) => ({ ...prev, status: newStatus }));
        }
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

      // כאן נשמרת החלטת המנהל על הכפילות, כולל הערה שמסבירה את שיקול הדעת.
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
    // מיפוי פנימי לערכים ברורים בעברית, כדי שהמנהל יראה משמעות ולא קודי מערכת.
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
    // מציגים מידע על כפילות גם אם המנהל סימן "לא כפילות", כדי שלא יאבד הקשר ההיסטורי.
    suggestion?.isDuplicate || suggestion?.duplicateReviewStatus === 'not_duplicate'
  );

  const generateWordDocument = (s) => {
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
          createHebrewParagraph(`מספר ההצעה: ${s.id}`),
          createHebrewParagraph(`תאריך ההגשה: ${s.date}`),
          createHebrewParagraph(`סטטוס נוכחי: ${s.status}`, { spacing: { after: 300 } }),
          createHebrewParagraph('------------------------------------------------', { alignment: AlignmentType.CENTER }),
          createHebrewParagraph('פרטי המגיש:', { heading: HeadingLevel.HEADING_2 }),
          createHebrewParagraph(`שם: ${s.soldier?.soldierName || ''}`),
          createHebrewParagraph(`ת"ז: ${s.soldier?.idNumber || ''}`),
          createHebrewParagraph(`יחידה: ${s.unit || ''} | גף: ${s.gaf || ''}`, { spacing: { after: 300 } }),
          createHebrewParagraph('פרטי ההצעה:', { heading: HeadingLevel.HEADING_2 }),
          createHebrewParagraph('נושא:', { textOptions: { bold: true } }),
          createHebrewParagraph(s.title || '', { spacing: { after: 150 } }),
          createHebrewParagraph('מצב קיים:', { textOptions: { bold: true } }),
          createHebrewParagraph(s.currentState || '', { spacing: { after: 150 } }),
          createHebrewParagraph('ההצעה:', { textOptions: { bold: true } }),
          createHebrewParagraph(s.proposal || '', { spacing: { after: 150 } }),
          createHebrewParagraph('תועלת צפויה (שיפור):', { textOptions: { bold: true } }),
          createHebrewParagraph(s.improvement || '', { spacing: { after: 300 } }),
          createHebrewParagraph('------------------------------------------------', { alignment: AlignmentType.CENTER }),
          createHebrewParagraph('חתימת רמ"ד / מפקד יחידה: ___________________', { spacing: { before: 500 } })
        ]
      }]
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `IdeaForce_${s.id}.docx`);
    });
  };

  const filteredSuggestions = suggestions.filter((s) => {
    const matchesSearch = s.title?.includes(searchTerm)
      || s.soldier?.soldierName?.includes(searchTerm)
      || s.soldier?.idNumber?.includes(searchTerm);
    const matchesStatus = statusFilter === 'הכל' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>ממשק ניהול הצעות</h1>
        <div className="header-actions">
          <button className="stats-btn" onClick={() => navigate('/admin/stats')}>
            פתיחת נתוני הצעות ייעול
          </button>
          <button className="logout-btn" onClick={() => navigate('/')}>יציאה</button>
        </div>
      </header>

      <div className="admin-content-wrapper">
        <div className="admin-controls">
          <input
            type="text"
            placeholder="חיפוש חופשי..."
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
        </div>

        <div className="table-container">
          {loading ? <p>טוען נתונים...</p> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>מגיש</th>
                  <th>כותרת</th>
                  <th>יחידה</th>
                  <th>כפילות</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuggestions.map((s) => (
                  <tr key={s.id || s._id}>
                    <td>{s.date}</td>
                    <td>
                      <div className="soldier-info">
                        <strong>{s.soldier?.soldierName}</strong>
                        <span>{s.soldier?.idNumber}</span>
                      </div>
                    </td>
                    <td>{s.title}</td>
                    <td>{s.unit}</td>
                    <td>
                      {hasDuplicateState(s) ? (
                        <span className="duplicate-badge">
                          {/* אזהרה ויזואלית שמבליטה למנהל שיש כאן הצעה שדורשת שיקול דעת. */}
                          <span className="duplicate-icon">⚠</span>
                          {getDuplicateDecisionLabel(s.duplicateReviewStatus, s.isDuplicate)}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${s.status === 'מאושר' ? 'green' : s.status === 'נדחה' ? 'red' : 'gray'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td><button className="view-btn" onClick={() => setSelectedSuggestion(s)}>צפה בפרטים</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedSuggestion && (
        <div className="modal-overlay" onClick={() => setSelectedSuggestion(null)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSuggestion(null)}>X</button>
            <div className="modal-header">
              <h2>{selectedSuggestion.title}</h2>
              <span className="modal-id">#{selectedSuggestion.id}</span>
            </div>
            <div className="modal-grid">
              <div className="modal-section">
                <h3>פרטי ההצעה</h3>
                <div className="detail-item"><label>מצב קיים:</label><p>{selectedSuggestion.currentState}</p></div>
                <div className="detail-item"><label>ההצעה:</label><p>{selectedSuggestion.proposal}</p></div>
                <div className="detail-item"><label>שיפור צפוי:</label><p>{selectedSuggestion.improvement}</p></div>
              </div>
              <div className="modal-sidebar">
                <div className="sidebar-box">
                  <h3>פרטי המגיש</h3>
                  <p><strong>שם:</strong> {selectedSuggestion.soldier?.soldierName}</p>
                  <p><strong>ת"ז:</strong> {selectedSuggestion.soldier?.idNumber}</p>
                  <p><strong>טלפון:</strong> {selectedSuggestion.soldier?.phone}</p>
                  <p><strong>יחידה:</strong> {selectedSuggestion.unit}</p>
                </div>

                {hasDuplicateState(selectedSuggestion) && (
                  <div className="sidebar-box duplicate-box">
                    <h3>ניהול כפילות</h3>
                    <div className="duplicate-summary-row">
                      <span className="duplicate-badge">
                        <span className="duplicate-icon">⚠</span>
                        {getDuplicateDecisionLabel(selectedSuggestion.duplicateReviewStatus, selectedSuggestion.isDuplicate)}
                      </span>
                    </div>
                    <p><strong>דומה להצעה מספר:</strong> {selectedSuggestion.duplicateOfId || '-'}</p>
                    <p><strong>כותרת הצעה דומה:</strong> {selectedSuggestion.duplicateOfTitle || '-'}</p>
                    {/* כפתור מעבר מהיר להצעה המקושרת, כדי להשוות בלי לחפש ידנית בטבלה. */}
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
                      placeholder="הערת מנהל: למה זו כפילות, שדרוג, או לא כפילות"
                    />
                    <button className="duplicate-save-btn" onClick={() => handleDuplicateReviewSave(selectedSuggestion.id || selectedSuggestion._id)}>
                      שמירת החלטת כפילות
                    </button>
                  </div>
                )}

                <div className="sidebar-box action-box">
                  <h3>ניהול</h3>
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
                  <button className="word-export-btn" onClick={() => generateWordDocument(selectedSuggestion)}>ייצוא ל-Word</button>
                  <button className="delete-btn" onClick={() => handleDelete(selectedSuggestion.id || selectedSuggestion._id)}>מחק הצעה</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
