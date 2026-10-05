import 'express-async-errors'; // lets async route errors reach the error handler below
import express from 'express'; import cors from 'cors'; import 'dotenv/config';
import authRoutes from './routes/auth.js'; import taskRoutes from './routes/tasks.js'; import statRoutes from './routes/stats.js';
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL })); // only our frontend may call the API
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes); app.use('/api/tasks', taskRoutes); app.use('/api/statistics', statRoutes);
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on the server' }); });
app.listen(process.env.PORT || 5000, () => console.log('API running'));
