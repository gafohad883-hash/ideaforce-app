import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API_BASE_URL from '../config/api';
import '../styles/AdminStats.css';

function AdminStats() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  
  // צבעים מקצועיים לגרפים
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  useEffect(() => {
    fetch(`${API_BASE_URL}/suggestions`)
      .then(res => res.json())
      .then(data => setSuggestions(data))
      .catch(err => console.error(err));
  }, []);

  // --- חישובי סטטיסטיקה ---
  const total = suggestions.length;
  const approved = suggestions.filter(s => s.status === 'מאושר').length;
  const pending = suggestions.filter(s => s.status === 'בהמתנה').length;
  const inProgress = suggestions.filter(s => s.status === 'בטיפול').length;

  const getStatusStats = () => {
    const stats = {};
    suggestions.forEach(s => stats[s.status] = (stats[s.status] || 0) + 1);
    return Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
  };

  const getUnitStats = () => {
    const stats = {};
    suggestions.forEach(s => {
        if(s.unit) stats[s.unit] = (stats[s.unit] || 0) + 1;
    });
    return Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
  };

  return (
    <div className="stats-page">
      <header className="stats-header">
        <h1>דוח נתוני הצעות ייעול - תמונת מצב</h1>
        <button className="back-btn" onClick={() => navigate('/admin')}>חזרה לניהול</button>
      </header>

      <div className="kpi-container">
        <div className="kpi-card blue">
            <h3>סה"כ הצעות</h3>
            <div className="kpi-number">{total}</div>
        </div>
        <div className="kpi-card green">
            <h3>הצעות שאושרו</h3>
            <div className="kpi-number">{approved}</div>
        </div>
        <div className="kpi-card orange">
            <h3>ממתינות לאישור</h3>
            <div className="kpi-number">{pending}</div>
        </div>
        <div className="kpi-card purple">
            <h3>בטיפול</h3>
            <div className="kpi-number">{inProgress}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-large-card">
            <h3>התפלגות סטטוסים</h3>
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie 
                        data={getStatusStats()} 
                        cx="50%" cy="50%" 
                        outerRadius={120} 
                        fill="#8884d8" 
                        dataKey="value" 
                        label={({name, value}) => `${name}: ${value}`}
                    >
                        {getStatusStats().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>

        <div className="chart-large-card">
            <h3>הצעות לפי יחידות</h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={getUnitStats()} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={80} tick={{fontSize: 12}} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f0f0f0'}} />
                    <Bar dataKey="value" fill="#0052a3" radius={[5, 5, 0, 0]} barSize={50} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AdminStats;