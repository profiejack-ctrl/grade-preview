import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  getAllSubjects,
  saveSubject,
  deleteSubject,
  resetDatabase,
  getDbHealth,
  isUsingNeon
} from './dataService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', async (req, res) => {
  const health = await getDbHealth();
  res.json(health);
});

app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    res.json(subjects);
  } catch (err) {
    console.error('GET /api/subjects error:', err);
    res.status(500).json({ error: 'Failed to retrieve subjects', details: err.message });
  }
});

app.post('/api/subjects', async (req, res) => {
  try {
    const subject = req.body;
    if (!subject || !subject.code || !subject.title) {
      return res.status(400).json({ error: 'Invalid subject data' });
    }

    const id = await saveSubject(subject);
    console.log(`Saved subject ${subject.code} (${subject.records?.length || 0} students)`);
    res.json({ success: true, id });
  } catch (err) {
    console.error('POST /api/subjects error:', err);
    res.status(500).json({ error: 'Failed to save subject', details: err.message });
  }
});

app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSubject(id);
    console.log(`Deleted subject ${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/subjects error:', err);
    res.status(500).json({ error: 'Failed to delete subject', details: err.message });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    const refreshed = await resetDatabase();
    res.json({ success: true, subjects: refreshed });
  } catch (err) {
    console.error('POST /api/reset error:', err);
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GradePulse API server listening on http://0.0.0.0:${PORT} [Database: ${isUsingNeon() ? 'Neon PostgreSQL' : 'SQLite'}]`);
});
