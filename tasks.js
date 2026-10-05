import { Router } from 'express'; import pool from '../db.js'; import auth from '../middleware/auth.js';
const r = Router(); r.use(auth); // every task route needs login

// BACKLOG LOGIC: not stored in the DB. It is calculated on every read:
// not completed + date before today  => 'backlog'. The original date is never overwritten.
export const SELECT = `SELECT id, title, description, to_char(date,'YYYY-MM-DD') AS date,
  to_char(original_date,'YYYY-MM-DD') AS original_date, priority, category, is_special, completed_at, created_at,
  CASE WHEN status='completed' THEN 'completed' WHEN date < CURRENT_DATE THEN 'backlog' ELSE 'pending' END AS status
  FROM tasks`;
const bad = (res, m) => res.status(400).json({ error: m });
const validate = (b) => !b.title?.trim() ? 'Title is required' : !/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? 'A valid date is required'
  : b.priority && !['low','medium','high'].includes(b.priority) ? 'Invalid priority' : null;

r.get('/', async (req, res) => {
  const q = `%${req.query.search || ''}%`;
  const { rows } = await pool.query(`${SELECT} WHERE user_id=$1 AND (title ILIKE $2 OR description ILIKE $2) ORDER BY date`, [req.userId, q]);
  res.json(rows);
});
r.get('/backlog', async (req, res) => {
  const { rows } = await pool.query(`${SELECT} WHERE user_id=$1 AND status='pending' AND date < CURRENT_DATE ORDER BY date`, [req.userId]);
  res.json(rows);
});
r.get('/month/:year/:month', async (req, res) => {
  const { rows } = await pool.query(`${SELECT} WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3 ORDER BY date, id`,
    [req.userId, req.params.year, req.params.month]);
  res.json(rows);
});
r.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return bad(res, 'Invalid task id');
  const { rows } = await pool.query(`${SELECT} WHERE id=$1 AND user_id=$2`, [req.params.id, req.userId]); // user_id check = no peeking at others' tasks
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Task not found' });
});
r.post('/', async (req, res) => {
  const err = validate(req.body); if (err) return bad(res, err);
  const { title, description = '', date, priority = 'medium', category = 'Other', is_special = false } = req.body;
  const { rows } = await pool.query(`INSERT INTO tasks(user_id,title,description,date,priority,category,is_special) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.userId, title.trim(), description, date, priority, category, !!is_special]);
  res.status(201).json(rows[0]);
});
r.put('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return bad(res, 'Invalid task id');
  const err = validate(req.body); if (err) return bad(res, err);
  const { title, description = '', date, priority = 'medium', category = 'Other', is_special = false } = req.body;
  // If the date changes (reschedule), remember where the task originally was
  const { rowCount } = await pool.query(`UPDATE tasks SET title=$1, description=$2, priority=$3, category=$4, is_special=$5,
    original_date = CASE WHEN date <> $6 THEN COALESCE(original_date, date) ELSE original_date END, date=$6, updated_at=NOW()
    WHERE id=$7 AND user_id=$8`, [title.trim(), description, priority, category, !!is_special, date, req.params.id, req.userId]);
  rowCount ? res.json({ message: 'Updated' }) : res.status(404).json({ error: 'Task not found' });
});
r.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['pending','completed'].includes(status)) return bad(res, 'Status must be pending or completed');
  const { rowCount } = await pool.query(`UPDATE tasks SET status=$1::varchar, completed_at=CASE WHEN $1::varchar='completed' THEN NOW() ELSE NULL END, updated_at=NOW()
    WHERE id=$2 AND user_id=$3`, [status, req.params.id, req.userId]);
  rowCount ? res.json({ message: 'Status updated' }) : res.status(404).json({ error: 'Task not found' });
});
r.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
  rowCount ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Task not found' });
});
export default r;
