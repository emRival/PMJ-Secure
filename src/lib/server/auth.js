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
        return {
            id: user.id,
            username: user.username,
            two_factor_enabled: user.two_factor_enabled === 1
        };
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
      SELECT sessions.*, users.username, users.two_factor_enabled
      FROM sessions 
      JOIN users ON sessions.user_id = users.id 
      WHERE sessions.id = ? AND sessions.expires_at > datetime('now')
    `);
        const session = stmt.get(sessionId);
        if (session) {
            session.two_factor_enabled = session.two_factor_enabled === 1;
        }
        return session;
    },

    deleteSession(sessionId) {
        const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
        stmt.run(sessionId);
    },

    // 2FA Methods
    async create2FASecret(userId) {
        const { authenticator } = await import('otplib');
        const secret = authenticator.generateSecret();
        const stmt = db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?');
        stmt.run(secret, userId);
        return secret;
    },

    async enable2FA(userId, token) {
        const { authenticator } = await import('otplib');
        const stmt = db.prepare('SELECT two_factor_secret FROM users WHERE id = ?');
        const user = stmt.get(userId);

        if (!user || !user.two_factor_secret) {
            throw new Error("2FA Setup not initiated");
        }

        const isValid = authenticator.check(token, user.two_factor_secret);
        if (!isValid) return false;

        const updateStmt = db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?');
        updateStmt.run(userId);
        return true;
    },

    async disable2FA(userId) {
        const stmt = db.prepare('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?');
        stmt.run(userId);
    },

    async validate2FA(userId, token) {
        const { authenticator } = await import('otplib');
        const stmt = db.prepare('SELECT two_factor_secret FROM users WHERE id = ?');
        const user = stmt.get(userId);

        if (!user || !user.two_factor_secret) return false;

        return authenticator.check(token, user.two_factor_secret);
    },

    get2FAStatus(userId) {
        const stmt = db.prepare('SELECT two_factor_enabled FROM users WHERE id = ?');
        const user = stmt.get(userId);
        return user ? user.two_factor_enabled === 1 : false;
    }
};
