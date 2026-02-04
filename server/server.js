require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs'); // הוספנו מודול למערכת הקבצים

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ה"בלש" החכם: מציאת תיקיית האתר ---
const clientPath = path.join(__dirname, '../client');
// בודק אם קיימת תיקיית build, ואם לא - מחפש תיקיית dist
const buildPath = fs.existsSync(path.join(clientPath, 'build')) 
    ? path.join(clientPath, 'build') 
    : path.join(clientPath, 'dist');

console.log(`📂 Serving static files from: ${buildPath}`); // לוג בשרת כדי שנראה מה קורה

// הגשת הקבצים הסטטיים
if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
}

// --- חיבור למסד הנתונים ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connection Successful: MongoDB Connected!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- הגדרת המייל (השולח והמקבל) ---
const MANAGER_EMAIL = 'gafohad883@gmail.com';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MANAGER_EMAIL,
    pass: 'wtka uqnc dncw nnsh' 
  }
});

// --- הגדרת המודל ---
const suggestionSchema = new mongoose.Schema({
  id: String,
  date: String,
  status: String,
  classification: String,
  title: String,
  currentState: String,
  proposal: String,
  improvement: String,
  domain: String,
  otherDomain: String,
  unit: String,
  gaf: String,
  soldier: {
    soldierName: String,
    idNumber: String,
    phone: String,
    email: String,
    rank: String,
    serviceType: String
  },
  history: [{ date: String, status: String, note: String }]
}, { timestamps: true });

const Suggestion = mongoose.model("Suggestion", suggestionSchema);

// --- Routes (API) ---

app.get("/api/suggestions", async (req, res) => {
  try {
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.post("/api/suggestions", async (req, res) => {
  try {
    const existing = await Suggestion.findOne({ title: req.body.title });
    if (existing) {
        return res.status(409).json({ error: "קיים כבר רעיון עם כותרת זהה במערכת" });
    }
    const count = await Suggestion.countDocuments();
    const newId = `2026-${String(count + 1).padStart(3, "0")}`;
    const today = new Date().toLocaleDateString('he-IL');
    const newSuggestion = new Suggestion({
      ...req.body,
      id: newId,
      date: today,
      status: "בהמתנה",
      history: [{ date: new Date().toISOString(), status: "בהמתנה", note: "הוגש ע\"י החייל" }]
    });
    await newSuggestion.save();

    // התראה למנהל
    const mailOptions = {
        from: `IdeaForce System <${MANAGER_EMAIL}>`,
        to: MANAGER_EMAIL,
        subject: `🔔 הצעה חדשה התקבלה: ${req.body.title}`,
        text: `היי המפקדת,\n\nהתקבלה הצעה חדשה במערכת!\n\nמגיש: ${req.body.soldier.soldierName}\nנושא: ${req.body.title}\n\nהיכנסי למערכת לטיפול.`
    };
    transporter.sendMail(mailOptions, (err) => { if (err) console.log("Mail error:", err); });

    res.status(201).json(newSuggestion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save" });
  }
});

app.patch("/api/suggestions/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const suggestion = await Suggestion.findOne({ id: req.params.id });
    if (!suggestion) return res.status(404).json({ error: "Not found" });

    suggestion.status = status;
    suggestion.history.push({ date: new Date().toISOString(), status: status, note: "עדכון מנהל" });
    await suggestion.save();

    if (suggestion.soldier?.email && suggestion.soldier.email.includes('@')) {
        const mailOptions = {
            from: `מערכת IdeaForce <${MANAGER_EMAIL}>`,
            to: suggestion.soldier.email,
            subject: `עדכון סטטוס להצעתך: ${suggestion.title}`,
            text: `שלום ${suggestion.soldier.soldierName},\n\nהסטטוס של הצעת הייעול שלך ("${suggestion.title}") עודכן ל: ${status}.\n\nבברכה,\nצוות IdeaForce (גף אוהד)`
        };
        transporter.sendMail(mailOptions, (err) => { if (err) console.log("Mail error:", err); });
    }
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/api/suggestions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let result = await Suggestion.findOneAndDelete({ id: id });
        if (!result) result = await Suggestion.findByIdAndDelete(id); 
        if (result) res.json({ message: "Deleted" });
        else res.status(404).json({ error: "Not found" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

// --- ניתוב לכל שאר הבקשות (React) ---
app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // אם הקובץ לא נמצא, נחזיר הודעת שגיאה ברורה לדפדפן
    res.status(404).send(`
      <h1>Error: Build folder not found</h1>
      <p>Server looked in: ${buildPath}</p>
      <p>Please check Render logs to see if 'npm run build' succeeded.</p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server & Client running together on Port ${PORT}`);
});