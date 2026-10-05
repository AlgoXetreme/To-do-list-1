import { Router } from 'express'; import pool from '../db.js'; import auth from '../middleware/auth.js'; import { SELECT } from './tasks.js';
const r = Router(); r.use(auth);
// All numbers are counted from real rows of the chosen month
r.get('/:year/:month', async (req, res) => {
  const { rows } = await pool.query(`${SELECT} WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2 AND EXTRACT(MONTH FROM date)=$3`,
    [req.userId, req.params.year, req.params.month]);
  const count = (s) => rows.filter((t) => t.status === s).length;
  const total = rows.length, completed = count('completed');
  const weekly = [0, 0, 0, 0, 0]; const perDay = {};
  rows.filter((t) => t.status === 'completed').forEach((t) => {
    const day = Number(t.date.slice(8)); weekly[Math.ceil(day / 7) - 1]++; perDay[t.date] = (perDay[t.date] || 0) + 1;
  });
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
  const bestDay = top(perDay), bestWeek = top(Object.fromEntries(weekly.map((n, i) => [i + 1, n])));
  res.json({ total, completed, pending: count('pending'), backlog: count('backlog'),
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    weekly: weekly.map((n, i) => ({ week: `Week ${i + 1}`, completed: n })),
    mostProductiveDay: bestDay ? { date: bestDay[0], completed: bestDay[1] } : null,
    mostProductiveWeek: bestWeek && bestWeek[1] > 0 ? { week: Number(bestWeek[0]), completed: bestWeek[1] } : null,
    highPriorityCompleted: rows.filter((t) => t.status === 'completed' && t.priority === 'high').length });
});
export default r;
