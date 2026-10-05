import { Router } from 'express'; import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken';
import pool from '../db.js';
const r = Router();
const makeToken = (u) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safe = (u) => ({ id: u.id, name: u.name, email: u.email }); // never send the password

r.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query('INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *', [name, email.toLowerCase(), hash]);
    res.status(201).json({ token: makeToken(rows[0]), user: safe(rows[0]) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: makeToken(rows[0]), user: safe(rows[0]) });
});

// JWTs are stateless: logout = the client deletes its token
r.post('/logout', (req, res) => res.json({ message: 'Logged out' }));
export default r;
