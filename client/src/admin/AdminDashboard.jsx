import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
// הורדנו את ה-import של הגרפים מכאן כי הם עברו לדף החדש
import API_BASE_URL from '../config/api';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('הכל');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("האם את בטוחה שברצונך למחוק את ההצעה לצמיתות?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        setSelectedSuggestion(null);
        alert("ההצעה נמחקה.");
      }
    } catch (error) { console.error(error); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/suggestions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSuggestions(prev => prev.map(s => s.id === id || s._id === id ? { ...s, status: newStatus } : s));
        if (selectedSuggestion && (selectedSuggestion.id === id || selectedSuggestion._id === id)) {
            setSelectedSuggestion(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) { console.error(error); }
  };

  // --- וורד (נשאר אותו דבר) ---
  const generateWordDocument = (s) => {
    const createHebrewParagraph = (text, options = {}) => {
        return new Paragraph({
            children: [new TextRun({ text: text, size: 24, font: "Arial", ...options.textOptions })],
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            ...options
        });
    };

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "טופס הצעת ייעול - IdeaForce",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 300 },
          }),
          createHebrewParagraph(`מספר הצעה: ${s.id}`),
          createHebrewParagraph(`תאריך הגשה: ${s.date}`),
          createHebrewParagraph(`סטטוס נוכחי: ${s.status}`, { spacing: { after: 300 } }),
          createHebrewParagraph("------------------------------------------------", { alignment: AlignmentType.CENTER }),
          createHebrewParagraph("פרטי המגיש:", { heading: HeadingLevel.HEADING_2 }),
          createHebrewParagraph(`שם: ${s.soldier?.soldierName || ''}`),
          createHebrewParagraph(`ת"ז: ${s.soldier?.idNumber || ''}`),
          createHebrewParagraph(`יחידה: ${s.unit || ''} | גף: ${s.gaf || ''}`, { spacing: { after: 300 } }),
          createHebrewParagraph("פרטי ההצעה:", { heading: HeadingLevel.HEADING_2 }),
          createHebrewParagraph("נושא:", { textOptions: { bold: true } }),
          createHebrewParagraph(s.title || '', { spacing: { after: 150 } }),
          createHebrewParagraph("מצב קיים:", { textOptions: { bold: true } }),
          createHebrewParagraph(s.currentState || '', { spacing: { after: 150 } }),
          createHebrewParagraph("ההצעה:", { textOptions: { bold: true } }),
          createHebrewParagraph(s.proposal || '', { spacing: { after: 150 } }),
          createHebrewParagraph("תועלת צפויה (שיפור):", { textOptions: { bold: true } }),
          createHebrewParagraph(s.improvement || '', { spacing: { after: 300 } }),
          createHebrewParagraph("------------------------------------------------", { alignment: AlignmentType.CENTER }),
          createHebrewParagraph("חתימת רמ\"ד / מפקד יחידה: ___________________", { spacing: { before: 500 } }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => { saveAs(blob, `IdeaForce_${s.id}.docx`); });
  };

  const filteredSuggestions = suggestions.filter(s => {
    const matchesSearch = s.title?.includes(searchTerm) || s.soldier?.soldierName?.includes(searchTerm) || s.soldier?.idNumber?.includes(searchTerm);
    const matchesStatus = statusFilter === 'הכל' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>ממשק ניהול הצעות</h1>
        <div className="header-actions">
            {/* הכפתור החדש והיפה */}
            <button className="stats-btn" onClick={() => navigate('/admin/stats')}>
                📊 פתיחת נתוני הצעות ייעול
            </button>
            <button className="logout-btn" onClick={() => navigate('/')}>יציאה</button>
        </div>
      </header>

      {/* אזור הפילטרים והטבלה בלבד */}
      <div className="admin-content-wrapper">
        <div className="admin-controls">
            <input type="text" placeholder="חיפוש חופשי..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="admin-search" />
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
                    <th>סטטוס</th>
                    <th>פעולות</th>
                </tr>
                </thead>
                <tbody>
                {filteredSuggestions.map(s => (
                    <tr key={s.id || s._id}>
                    <td>{s.date}</td>
                    <td><div className="soldier-info"><strong>{s.soldier?.soldierName}</strong><span>{s.soldier?.idNumber}</span></div></td>
                    <td>{s.title}</td>
                    <td>{s.unit}</td>
                    <td><span className={`status-badge ${s.status === 'מאושר' ? 'green' : s.status === 'נדחה' ? 'red' : 'gray'}`}>{s.status}</span></td>
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
                <div className="modal-header"><h2>{selectedSuggestion.title}</h2><span className="modal-id">#{selectedSuggestion.id}</span></div>
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
                        <div className="sidebar-box action-box">
                            <h3>ניהול</h3>
                            <select value={selectedSuggestion.status} onChange={(e) => handleStatusChange(selectedSuggestion.id || selectedSuggestion._id, e.target.value)} className="modal-status-select">
                                <option value="בהמתנה">בהמתנה</option>
                                <option value="בטיפול">בטיפול</option>
                                <option value="מאושר">מאושר</option>
                                <option value="נדחה">נדחה</option>
                            </select>
                            <button className="word-export-btn" onClick={() => generateWordDocument(selectedSuggestion)}>📄 ייצוא ל-Word</button>
                            <button className="delete-btn" onClick={() => handleDelete(selectedSuggestion.id || selectedSuggestion._id)}>🗑️ מחק הצעה</button>
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