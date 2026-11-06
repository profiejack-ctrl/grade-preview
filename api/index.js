import express from 'express';
import cors from 'cors';
import {
  getAllSubjects,
  saveSubject,
  deleteSubject,
  resetDatabase,
  getDbHealth
} from '../server/dataService.js';
import seedSubjects from '../server/seedData.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const health = await getDbHealth();
    res.json(health);
  } catch (err) {
    res.status(200).json({ status: 'warning', error: err.message, database: 'missing-database-url' });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    res.json(subjects);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.json(seedSubjects);
  }
});

router.post('/subjects', async (req, res) => {
  try {
    const subject = req.body;
    if (!subject || !subject.code || !subject.title) {
      return res.status(400).json({ error: 'Subject code and title are required' });
    }
    const id = await saveSubject(subject);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error saving subject:', err);
    res.status(500).json({ error: 'Failed to save subject', details: err.message });
  }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSubject(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting subject:', err);
    res.status(500).json({ error: 'Failed to delete subject', details: err.message });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const subjects = await resetDatabase();
    res.json({ success: true, subjects });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
});

app.use('/api', router);
app.use('/', router);

export default app;
