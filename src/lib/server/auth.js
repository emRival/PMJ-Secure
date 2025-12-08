import db from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const Auth = {
    async createUser(username, password) {
        const id = uuidv4();
        const password_hash = await bcrypt.hash(password, 10);
        try {
            const stmt = db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)');
            stmt.run(id, username, password_hash);
            return { id, username };
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                throw new Error('Username already exists');
            }
            throw err;
        }
    },

    async verifyUser(username, password) {
        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;
        return { id: user.id, username: user.username };
    },

    createSession(userId) {
        const id = uuidv4();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
        const stmt = db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)');
        stmt.run(id, userId, expiresAt.toISOString());
        return id;
    },

    getSession(sessionId) {
        const stmt = db.prepare(`
      SELECT sessions.*, users.username 
      FROM sessions 
      JOIN users ON sessions.user_id = users.id 
      WHERE sessions.id = ? AND sessions.expires_at > datetime('now')
    `);
        return stmt.get(sessionId);
    },

    deleteSession(sessionId) {
        const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
        stmt.run(sessionId);
    }
};
