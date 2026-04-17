import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import API_BASE_URL from '../config/api';
import '../styles/AdminStats.css';

const STATUS_ORDER = ['בהמתנה', 'בטיפול', 'מאושר', 'נדחה'];
const STATUS_COLORS = {
  'בהמתנה': '#f59e0b',
  'בטיפול': '#2563eb',
  'מאושר': '#059669',
  'נדחה': '#dc2626'
};
const PIE_COLORS = ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed', '#0f766e', '#ea580c'];
const TIME_FILTERS = [
  { value: 'all', label: 'כל התקופות' },
  { value: '30d', label: '30 ימים אחרונים' },
  { value: 'quarter', label: 'רבעון אחרון' },
  { value: 'year', label: 'שנה אחרונה' }
];

function AdminStats() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    fetch(`${API_BASE_URL}/suggestions`)
      .then((res) => res.json())
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  const getSuggestionDate = (suggestion) => {
    const rawDate = suggestion.createdAt || suggestion.updatedAt || suggestion.date;
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const normalizeMonth = (value) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'לא ידוע';
    }

    // מנרמל תאריכים לפורמט חודשי אחיד כדי לבנות גרף מגמה ברור למנהל.
    return parsedDate.toLocaleDateString('he-IL', {
      month: 'short',
      year: '2-digit'
    });
  };

  const buildCountMap = (items, getKey) => {
    const map = {};
    // פונקציית עזר גנרית שמאפשרת לנו לבנות כמה פילוחים שונים בלי לשכפל לוגיקה.
    items.forEach((item) => {
      const key = getKey(item);
      if (!key) {
        return;
      }
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  };

  const toSortedData = (map, topLimit = null) => {
    const entries = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return topLimit ? entries.slice(0, topLimit) : entries;
  };

  const now = new Date();
  const filteredSuggestions = suggestions.filter((suggestion) => {
    // פילטר הזמן משפיע על כל הדשבורד, כדי שהמנהל יעבור ממצב סטטי לניתוח תקופתי אמיתי.
    if (timeFilter === 'all') {
      return true;
    }

    const suggestionDate = getSuggestionDate(suggestion);
    if (!suggestionDate) {
      return false;
    }

    const diffInMs = now.getTime() - suggestionDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (timeFilter === '30d') {
      return diffInDays <= 30;
    }

    if (timeFilter === 'quarter') {
      return diffInDays <= 90;
    }

    if (timeFilter === 'year') {
      return diffInDays <= 365;
    }

    return true;
  });

  const total = filteredSuggestions.length;
  // KPI מרכזיים שנותנים למנהל תמונת מצב מהירה בלי להיכנס לכל הצעה בנפרד.
  const pending = filteredSuggestions.filter((s) => s.status === 'בהמתנה').length;
  const inProgress = filteredSuggestions.filter((s) => s.status === 'בטיפול').length;
  const approved = filteredSuggestions.filter((s) => s.status === 'מאושר').length;
  const rejected = filteredSuggestions.filter((s) => s.status === 'נדחה').length;
  const duplicates = filteredSuggestions.filter((s) => s.isDuplicate).length;
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;

  const statusData = STATUS_ORDER.map((status) => ({
    name: status,
    value: filteredSuggestions.filter((s) => s.status === status).length
  })).filter((item) => item.value > 0);

  const domainData = toSortedData(buildCountMap(filteredSuggestions, (s) => s.domain || s.otherDomain || 'ללא תחום'));
  const unitData = toSortedData(buildCountMap(filteredSuggestions, (s) => s.unit || 'ללא יחידה'));
  const monthlyData = Object.entries(buildCountMap(filteredSuggestions, (s) => normalizeMonth(s.createdAt || s.date)))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.name.split(' ');
      const [bMonth, bYear] = b.name.split(' ');
      return `${aYear || ''}${aMonth || ''}`.localeCompare(`${bYear || ''}${bMonth || ''}`);
    });

  const topUnits = unitData.slice(0, 5);
  // מציג את ההצעות האחרונות כדי שהמנהל יראה מה חדש במערכת בזמן אמת.
  const latestSuggestions = [...filteredSuggestions]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 5);

  // הגרף הזה מראה אם הכפילויות באמת מטופלות, ולא רק מזוהות.
  const duplicateByDecision = toSortedData(buildCountMap(
    filteredSuggestions.filter((s) => s.isDuplicate || s.duplicateReviewStatus === 'not_duplicate'),
    (s) => {
      switch (s.duplicateReviewStatus) {
        case 'confirmed_duplicate':
          return 'כפילות מאושרת';
        case 'improved_version':
          return 'גרסה משופרת';
        case 'not_duplicate':
          return 'לא כפילות';
        case 'suspected':
          return 'כפילות חשודה';
        default:
          return s.isDuplicate ? 'כפילות חשודה' : null;
      }
    }
  ));

  const kpiCards = [
    { title: 'סה"כ הצעות', value: total, tone: 'blue', subtitle: 'כל ההצעות בטווח שנבחר' },
    { title: 'בהמתנה', value: pending, tone: 'amber', subtitle: 'ממתינות לטיפול' },
    { title: 'בטיפול', value: inProgress, tone: 'indigo', subtitle: 'בטיפול מנהלים' },
    { title: 'מאושרות', value: approved, tone: 'green', subtitle: `שיעור אישור ${approvalRate}%` },
    { title: 'נדחו', value: rejected, tone: 'red', subtitle: 'לא אושרו להמשך' },
    { title: 'כפולות', value: duplicates, tone: 'gold', subtitle: 'סומנו ככפילויות' }
  ];

  const activeTimeFilterLabel = TIME_FILTERS.find((item) => item.value === timeFilter)?.label || 'כל התקופות';

  return (
    <div className="stats-page">
      <header className="stats-header">
        <div>
          <span className="stats-eyebrow">Dashboard</span>
          <h1>דשבורד ניהול הצעות ייעול</h1>
          <p>תמונת מצב עדכנית, מגמות ותובנות לקבלת החלטות.</p>
        </div>
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>חזרה לניהול</button>
      </header>

      <section className="dashboard-toolbar">
        <div className="time-filter-group">
          <span className="time-filter-label">טווח ניתוח:</span>
          <div className="time-filter-buttons">
            {TIME_FILTERS.map((filterOption) => (
              <button
                key={filterOption.value}
                className={`time-filter-btn ${timeFilter === filterOption.value ? 'active' : ''}`}
                onClick={() => setTimeFilter(filterOption.value)}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
        <div className="time-filter-summary">
          הנתונים המוצגים: <strong>{activeTimeFilterLabel}</strong>
        </div>
      </section>

      <section className="kpi-grid">
        {kpiCards.map((card) => (
          <div key={card.title} className={`kpi-card ${card.tone}`}>
            <span className="kpi-label">{card.title}</span>
            <strong className="kpi-value">{card.value}</strong>
            <span className="kpi-subtitle">{card.subtitle}</span>
          </div>
        ))}
      </section>

      <section className="insight-strip">
        {/* כרטיסי תובנה קצרים שמסכמים למנהל "מה חשוב לדעת עכשיו". */}
        <div className="insight-card">
          <span className="insight-label">היחידה המובילה</span>
          <strong>{topUnits[0]?.name || 'אין נתונים'}</strong>
          <span>{topUnits[0]?.value || 0} הצעות</span>
        </div>
        <div className="insight-card">
          <span className="insight-label">התחום החזק</span>
          <strong>{domainData[0]?.name || 'אין נתונים'}</strong>
          <span>{domainData[0]?.value || 0} הצעות</span>
        </div>
        <div className="insight-card">
          <span className="insight-label">מגמת כפילויות</span>
          <strong>{duplicates}</strong>
          <span>הצעות דורשות תשומת לב</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel wide">
          <div className="panel-header">
            <div>
              <h3>הצעות לפי חודש</h3>
              <p>מגמת כניסת הצעות לאורך זמן</p>
            </div>
          </div>
          {/* גרף קו מתאים כאן כי המטרה היא לזהות מגמה לאורך זמן ולא רק ספירה נקודתית. */}
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0b5fff" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>התפלגות סטטוסים</h3>
              <p>כמה הצעות בכל שלב</p>
            </div>
          </div>
          {/* דיאגרמת עוגה נותנת תמונה מהירה של חלוקת הסטטוסים במערכת. */}
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>הצעות לפי תחום</h3>
              <p>פילוח נושאי העבודה</p>
            </div>
          </div>
          {/* בר אופקי נוח יותר כשיש שמות תחומים ארוכים. */}
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={domainData.slice(0, 7)} layout="vertical" margin={{ top: 8, right: 12, left: 24, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                  {domainData.slice(0, 7).map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>הצעות לפי יחידה</h3>
              <p>איפה יש מעורבות גבוהה יותר</p>
            </div>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={unitData.slice(0, 7)} margin={{ top: 12, right: 12, left: 12, bottom: 72 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6" />
                <XAxis dataKey="name" angle={-22} textAnchor="end" interval={0} height={80} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0052a3" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>יחידות עם הכי הרבה הצעות</h3>
              <p>טופ 5 יחידות מובילות</p>
            </div>
          </div>
          <div className="list-panel">
            {topUnits.length === 0 ? (
              <p className="empty-state">אין נתונים להצגה.</p>
            ) : (
              topUnits.map((unit, index) => (
                <div key={unit.name} className="list-row">
                  <div className="list-rank">{index + 1}</div>
                  <div className="list-main">
                    <strong>{unit.name}</strong>
                    <span>{unit.value} הצעות</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>5 הצעות אחרונות</h3>
              <p>מה נכנס לאחרונה למערכת</p>
            </div>
          </div>
          {/* רשימת האחרונות עוזרת למנהל לשלב בין ניתוח רוחבי לבין עבודה על פריטים טריים. */}
          <div className="list-panel">
            {latestSuggestions.length === 0 ? (
              <p className="empty-state">אין הצעות להצגה.</p>
            ) : (
              latestSuggestions.map((suggestion) => (
                <div key={suggestion.id || suggestion._id} className="suggestion-row">
                  <div className="suggestion-main">
                    <strong>{suggestion.title || 'ללא כותרת'}</strong>
                    <span>{suggestion.soldier?.soldierName || 'ללא מגיש'} | {suggestion.unit || 'ללא יחידה'}</span>
                  </div>
                  <div className="suggestion-side">
                    <span className={`status-pill ${suggestion.status || ''}`}>{suggestion.status || 'ללא סטטוס'}</span>
                    <small>{suggestion.date || '-'}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel wide">
          <div className="panel-header">
            <div>
              <h3>סטטוס טיפול בכפילויות</h3>
              <p>כמה כפילויות אושרו, נדחו או הוגדרו כשדרוג</p>
            </div>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={duplicateByDecision}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eef6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#c48a00" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminStats;
