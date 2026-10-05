import jwt from 'jsonwebtoken';
// Reads "Authorization: Bearer <token>", puts the user id on req.userId
export default function auth(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try { req.userId = jwt.verify(token, process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Session expired, log in again' }); }
}
