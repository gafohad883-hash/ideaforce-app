require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || process.env.MAIL_USER || '';
const MAIL_USER = process.env.MAIL_USER || '';
const MAIL_PASSWORD = process.env.MAIL_PASSWORD || '';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'IdeaForce';
const KEEP_ALIVE_ENABLED = process.env.KEEP_ALIVE_ENABLED === 'true';
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || '';
const KEEP_ALIVE_INTERVAL_MINUTES = Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES || 10);

app.use(cors());
app.use(express.json());

const clientPath = path.join(__dirname, '../client');
const buildPath = fs.existsSync(path.join(clientPath, 'build'))
  ? path.join(clientPath, 'build')
  : path.join(clientPath, 'dist');

console.log(`Serving static files from: ${buildPath}`);

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

function buildTransporter() {
  if (!MAIL_USER || !MAIL_PASSWORD) {
    console.warn('Mail transporter disabled: missing MAIL_USER or MAIL_PASSWORD');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 465),
    secure: String(process.env.MAIL_SECURE || 'true') === 'true',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

const transporter = buildTransporter();

async function verifyMailTransporter() {
  if (!transporter) {
    return;
  }

  try {
    await transporter.verify();
    console.log('Mail transporter verified successfully');
  } catch (error) {
    console.error('Mail transporter verification failed:', error.message);
  }
}

function createMailFrom() {
  return `"${MAIL_FROM_NAME}" <${MAIL_USER || MANAGER_EMAIL}>`;
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return '-';
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(dateValue);
  }

  return parsedDate.toLocaleString('he-IL');
}

function normalizeText(text = '') {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[׳"'.`,/#!$%^&*;:{}=\-_?~()]/g, '')
    .replace(/\s+/g, ' ');
}

function getWordsSet(text = '') {
  const normalized = normalizeText(text);
  return new Set(normalized.split(' ').filter((word) => word.length > 1));
}

function calculateSimilarity(text1 = '', text2 = '') {
  const words1 = getWordsSet(text1);
  const words2 = getWordsSet(text2);

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  let commonCount = 0;

  for (const word of words1) {
    if (words2.has(word)) {
      commonCount++;
    }
  }

  return commonCount / Math.max(words1.size, words2.size);
}

function mapDuplicateReason(reason) {
  switch (reason) {
    case 'exact-title-match':
      return 'התאמה מלאה בכותרת';
    case 'similar-title':
      return 'דמיון גבוה בכותרת';
    case 'similar-content':
      return 'דמיון גבוה בתוכן';
    default:
      return 'לא זוהתה סיבה';
  }
}

async function sendEmail(mailOptions) {
  if (!transporter) {
    console.warn('Skipped sending email: transporter is disabled');
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }
}

function buildManagerSuggestionEmail(suggestion, duplicateInfo) {
  const soldierName = suggestion.soldier?.fullName || suggestion.soldier?.soldierName || 'לא צוין';
  const duplicateText = duplicateInfo?.isDuplicate
    ? `כן
הצעה קשורה: ${duplicateInfo.duplicateOfId || '-'}
שם הצעה קשורה: ${duplicateInfo.duplicateOfTitle || '-'}
סיבת סימון: ${mapDuplicateReason(duplicateInfo.duplicateReason)}
ציון דמיון: ${Number(duplicateInfo.duplicateScore || 0).toFixed(2)}`
    : 'לא';

  return {
    from: createMailFrom(),
    to: MANAGER_EMAIL,
    subject: `הצעה חדשה התקבלה: ${suggestion.title || 'ללא כותרת'}`,
    text: `שלום,

התקבלה הצעה חדשה במערכת IdeaForce.

מספר הצעה: ${suggestion.id}
שם ההצעה: ${suggestion.title || '-'}
מגיש: ${soldierName}
תחום: ${suggestion.domain || suggestion.otherDomain || '-'}
יחידה: ${suggestion.unit || '-'}
סטטוס נוכחי: ${suggestion.status || '-'}
תאריך קליטה: ${formatDateTime(suggestion.createdAt || suggestion.date)}

סימון כפילות:
${duplicateText}

כדאי להיכנס למערכת ולעבור על ההצעה.`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#102a43">
        <h2 style="margin-bottom:8px;">התקבלה הצעה חדשה במערכת IdeaForce</h2>
        <p style="margin-top:0;">נוספה הצעה חדשה ומומלץ לעבור עליה בממשק הניהולי.</p>
        <table style="border-collapse:collapse;width:100%;max-width:640px;">
          <tbody>
            <tr><td><strong>מספר הצעה</strong></td><td>${suggestion.id}</td></tr>
            <tr><td><strong>שם ההצעה</strong></td><td>${suggestion.title || '-'}</td></tr>
            <tr><td><strong>מגיש</strong></td><td>${soldierName}</td></tr>
            <tr><td><strong>תחום</strong></td><td>${suggestion.domain || suggestion.otherDomain || '-'}</td></tr>
            <tr><td><strong>יחידה</strong></td><td>${suggestion.unit || '-'}</td></tr>
            <tr><td><strong>סטטוס נוכחי</strong></td><td>${suggestion.status || '-'}</td></tr>
            <tr><td><strong>תאריך קליטה</strong></td><td>${formatDateTime(suggestion.createdAt || suggestion.date)}</td></tr>
            <tr><td><strong>כפילות אפשרית</strong></td><td>${duplicateInfo?.isDuplicate ? 'כן' : 'לא'}</td></tr>
            ${duplicateInfo?.isDuplicate ? `<tr><td><strong>הצעה קשורה</strong></td><td>${duplicateInfo.duplicateOfId || '-'} | ${duplicateInfo.duplicateOfTitle || '-'}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `
  };
}

function buildSoldierStatusEmail(suggestion, status, note = '') {
  const soldierName = suggestion.soldier?.fullName || suggestion.soldier?.soldierName || '';
  const lastUpdateDate = suggestion.updatedAt || new Date().toISOString();

  return {
    from: createMailFrom(),
    to: suggestion.soldier.email,
    subject: `עדכון סטטוס להצעה ${suggestion.id}: ${suggestion.title || 'ללא כותרת'}`,
    text: `שלום ${soldierName},

הסטטוס של ההצעה שלך עודכן במערכת IdeaForce.

מספר הצעה: ${suggestion.id}
שם ההצעה: ${suggestion.title || '-'}
סטטוס חדש: ${status || '-'}
תאריך עדכון: ${formatDateTime(lastUpdateDate)}
${note ? `הערת מנהל: ${note}` : ''}

תודה על היוזמה והמעורבות.`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#102a43">
        <h2 style="margin-bottom:8px;">סטטוס ההצעה שלך עודכן</h2>
        <p style="margin-top:0;">המערכת עדכנה את מצב ההצעה וניתן לראות זאת גם באזור האישי.</p>
        <table style="border-collapse:collapse;width:100%;max-width:640px;">
          <tbody>
            <tr><td><strong>מספר הצעה</strong></td><td>${suggestion.id}</td></tr>
            <tr><td><strong>שם ההצעה</strong></td><td>${suggestion.title || '-'}</td></tr>
            <tr><td><strong>סטטוס חדש</strong></td><td>${status || '-'}</td></tr>
            <tr><td><strong>תאריך עדכון</strong></td><td>${formatDateTime(lastUpdateDate)}</td></tr>
            ${note ? `<tr><td><strong>הערת מנהל</strong></td><td>${note}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `
  };
}

function buildManagerContactEmail({ fullName, squadron, notes }) {
  return {
    from: createMailFrom(),
    to: MANAGER_EMAIL,
    subject: `פנייה חדשה למנהלת המערכת מאת ${fullName || 'חייל'}`,
    text: `התקבלה פנייה חדשה מתוך מסך הפתיחה.

שם החייל: ${fullName || '-'}
טייסת: ${squadron || '-'}
הערות: ${notes || '-'}`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#102a43">
        <h2 style="margin-bottom:8px;">התקבלה פנייה חדשה למנהלת המערכת</h2>
        <table style="border-collapse:collapse;width:100%;max-width:640px;">
          <tbody>
            <tr><td><strong>שם החייל</strong></td><td>${fullName || '-'}</td></tr>
            <tr><td><strong>טייסת</strong></td><td>${squadron || '-'}</td></tr>
            <tr><td><strong>הערות</strong></td><td>${notes || '-'}</td></tr>
          </tbody>
        </table>
      </div>
    `
  };
}

function performKeepAlivePing(targetUrl) {
  try {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const request = client.get(parsedUrl, (response) => {
      response.resume();
      console.log(`Keep-alive ping status: ${response.statusCode}`);
    });

    request.on('error', (error) => {
      console.error('Keep-alive ping failed:', error.message);
    });

    request.setTimeout(10000, () => {
      request.destroy(new Error('Ping timeout'));
    });
  } catch (error) {
    console.error('Keep-alive configuration is invalid:', error.message);
  }
}

function startKeepAlive() {
  // חשוב: פינג פנימי עוזר רק אם התהליך כבר רץ. בשרתים שנרדמים באמת עדיין צריך שירות חיצוני
  // כמו UptimeRobot שיפגע בנתיב health באופן קבוע.
  if (!KEEP_ALIVE_ENABLED || !KEEP_ALIVE_URL) {
    return;
  }

  const intervalMs = Math.max(KEEP_ALIVE_INTERVAL_MINUTES, 1) * 60 * 1000;
  console.log(`Keep-alive started for ${KEEP_ALIVE_URL} every ${KEEP_ALIVE_INTERVAL_MINUTES} minutes`);

  performKeepAlivePing(KEEP_ALIVE_URL);
  setInterval(() => performKeepAlivePing(KEEP_ALIVE_URL), intervalMs);
}

const suggestionSchema = new mongoose.Schema({
  id: String,
  date: String,
  status: String,
  // שדות שמאפשרים לשמור הצעה גם אם היא חשודה ככפילות, בלי לחסום את המגיש.
  isDuplicate: {
    type: Boolean,
    default: false
  },
  // החלטת המנהל לגבי הכפילות כדי להפוך סימון אוטומטי להחלטה ניהולית אמיתית.
  duplicateReviewStatus: {
    type: String,
    default: 'not_checked'
  },
  duplicateReviewNote: String,
  duplicateReviewedAt: String,
  duplicateOfId: String,
  duplicateOfTitle: String,
  duplicateReason: String,
  duplicateScore: Number,
  duplicateCheckedAt: String,
  displayInCommittee: {
    type: Boolean,
    default: false
  },
  committeeDate: String,
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
    fullName: String,
    soldierName: String,
    idNumber: String,
    phone: String,
    email: String,
    rank: String,
    serviceType: String
  },
  history: [{ date: String, status: String, note: String }]
}, { timestamps: true });

const Suggestion = mongoose.model('Suggestion', suggestionSchema);

app.get('/api/health', async (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;

  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    mongoConnected,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/suggestions', async (req, res) => {
  try {
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/contact-manager', async (req, res) => {
  try {
    const { fullName, squadron, notes } = req.body;

    if (!fullName || !squadron || !notes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (MANAGER_EMAIL) {
      await sendEmail(buildManagerContactEmail({ fullName, squadron, notes }));
    }

    res.status(201).json({ message: 'Message sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send contact message' });
  }
});

app.post('/api/suggestions', async (req, res) => {
  try {
    const newTitle = req.body.title || '';
    const newCombinedText = `
      ${req.body.title || ''}
      ${req.body.currentState || ''}
      ${req.body.proposal || ''}
      ${req.body.improvement || ''}
    `;

    const allSuggestions = await Suggestion.find({}, {
      title: 1,
      currentState: 1,
      proposal: 1,
      improvement: 1,
      id: 1
    });

    let duplicateSuggestion = null;
    let duplicateReason = '';
    let duplicateScore = 0;

    // משווים גם כותרת וגם תוכן מלא כדי לזהות כפילויות חכמות ולא רק התאמה מדויקת.
    for (const existingSuggestion of allSuggestions) {
      const existingTitle = existingSuggestion.title || '';
      const existingCombinedText = `
        ${existingSuggestion.title || ''}
        ${existingSuggestion.currentState || ''}
        ${existingSuggestion.proposal || ''}
        ${existingSuggestion.improvement || ''}
      `;

      const titleSimilarity = calculateSimilarity(newTitle, existingTitle);
      const contentSimilarity = calculateSimilarity(newCombinedText, existingCombinedText);

      const normalizedNewTitle = normalizeText(newTitle);
      const normalizedExistingTitle = normalizeText(existingTitle);

      const isExactTitleMatch = normalizedNewTitle === normalizedExistingTitle;
      const isVerySimilar = titleSimilarity >= 0.8 || contentSimilarity >= 0.6;

      if (isExactTitleMatch || isVerySimilar) {
        duplicateSuggestion = existingSuggestion;
        duplicateReason = isExactTitleMatch
          ? 'exact-title-match'
          : titleSimilarity >= 0.8
            ? 'similar-title'
            : 'similar-content';
        duplicateScore = Math.max(titleSimilarity, contentSimilarity);
        break;
      }
    }

    const count = await Suggestion.countDocuments();
    const newId = `2026-${String(count + 1).padStart(3, '0')}`;
    const today = new Date().toLocaleDateString('he-IL');
    const isDuplicate = Boolean(duplicateSuggestion);
    const initialNote = isDuplicate
      ? `הוגש על ידי החייל וסומן ככפילות אפשרית מול ${duplicateSuggestion.id || 'הצעה קיימת'}`
      : 'הוגש על ידי החייל';

    const newSuggestion = new Suggestion({
      ...req.body,
      id: newId,
      date: today,
      isDuplicate,
      duplicateReviewStatus: isDuplicate ? 'suspected' : 'not_checked',
      duplicateReviewNote: '',
      duplicateReviewedAt: '',
      // שומרים קישור להצעה הקיימת כדי שהמנהל יוכל לבדוק קשר ביניהן.
      duplicateOfId: duplicateSuggestion?.id || '',
      duplicateOfTitle: duplicateSuggestion?.title || '',
      duplicateReason,
      duplicateScore,
      duplicateCheckedAt: new Date().toISOString(),
      displayInCommittee: false,
      status: 'בהמתנה',
      history: [
        {
          date: new Date().toISOString(),
          status: 'בהמתנה',
          note: initialNote
        }
      ]
    });

    await newSuggestion.save();

    const duplicateInfo = isDuplicate
      ? {
          isDuplicate: true,
          duplicateOfId: duplicateSuggestion?.id || '',
          duplicateOfTitle: duplicateSuggestion?.title || '',
          duplicateReason,
          duplicateScore
        }
      : {
          isDuplicate: false
        };

    if (MANAGER_EMAIL) {
      await sendEmail(buildManagerSuggestionEmail(newSuggestion.toObject(), duplicateInfo));
    }

    res.status(201).json({
      ...newSuggestion.toObject(),
      duplicateInfo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.patch('/api/suggestions/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const suggestion = await Suggestion.findOne({ id: req.params.id });

    if (!suggestion) {
      return res.status(404).json({ error: 'Not found' });
    }

    suggestion.status = status;
    suggestion.history.push({
      date: new Date().toISOString(),
      status,
      note: note || 'עדכון מנהל'
    });

    await suggestion.save();

    if (suggestion.soldier?.email && suggestion.soldier.email.includes('@')) {
      await sendEmail(buildSoldierStatusEmail(suggestion.toObject(), status, note || ''));
    }

    res.json(suggestion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.patch('/api/suggestions/:id/committee', async (req, res) => {
  try {
    const { displayInCommittee, committeeDate } = req.body;
    const suggestion = await Suggestion.findOne({ id: req.params.id });

    if (!suggestion) {
      return res.status(404).json({ error: 'Not found' });
    }

    // מאפשר למנהל להחליט אם ההצעה תעלה לוועדת ייעול בלי לערבב זאת עם סטטוס הטיפול.
    suggestion.displayInCommittee = Boolean(displayInCommittee);
    suggestion.committeeDate = suggestion.displayInCommittee ? (committeeDate || '') : '';
    suggestion.history.push({
      date: new Date().toISOString(),
      status: suggestion.status,
      note: suggestion.displayInCommittee
        ? `סומן להצגה בוועדת ייעול${suggestion.committeeDate ? ` בתאריך ${suggestion.committeeDate}` : ''}`
        : 'הוסר מהצגה בוועדת ייעול'
    });

    await suggestion.save();
    res.json(suggestion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Committee update failed' });
  }
});

app.patch('/api/suggestions/:id/duplicate-review', async (req, res) => {
  try {
    const { reviewStatus, reviewNote } = req.body;
    const suggestion = await Suggestion.findOne({ id: req.params.id });

    if (!suggestion) {
      return res.status(404).json({ error: 'Not found' });
    }

    // המנהל יכול להפוך חשד אוטומטי להחלטה עסקית מתועדת.
    suggestion.duplicateReviewStatus = reviewStatus;
    suggestion.duplicateReviewNote = reviewNote || '';
    suggestion.duplicateReviewedAt = new Date().toISOString();

    if (reviewStatus === 'not_duplicate') {
      suggestion.isDuplicate = false;
    } else if (reviewStatus === 'confirmed_duplicate' || reviewStatus === 'improved_version' || reviewStatus === 'suspected') {
      suggestion.isDuplicate = true;
    }

    suggestion.history.push({
      date: new Date().toISOString(),
      status: suggestion.status,
      note: `Duplicate review: ${reviewStatus}${reviewNote ? ` | ${reviewNote}` : ''}`
    });

    await suggestion.save();

    res.json(suggestion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Duplicate review failed' });
  }
});

app.delete('/api/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let result = await Suggestion.findOneAndDelete({ id });
    if (!result) {
      result = await Suggestion.findByIdAndDelete(id);
    }

    if (result) {
      res.json({ message: 'Deleted' });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.get(/.*/, (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build folder not found. Check deployment logs.');
  }
});

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000
})
  .then(async () => {
    console.log('Connection Successful: MongoDB Connected!');
    await verifyMailTransporter();
    startKeepAlive();
  })
  .catch((err) => console.error('MongoDB Connection Error:', err));

app.listen(PORT, () => {
  console.log(`IdeaForce Server Running on Port ${PORT}`);
});
