import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { withoutPassword } from '../models.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development_only_change_me');
    const user = withoutPassword(db.users.findById(payload.userId));
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or expired. Please log in again.' });
  }
}
