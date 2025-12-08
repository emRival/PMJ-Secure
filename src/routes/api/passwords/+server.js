import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export function GET({ locals }) {
    if (!locals.user) {
        return json([]);
    }
    const stmt = db.prepare('SELECT * FROM passwords WHERE user_id = ? ORDER BY updated_at DESC');
    const passwords = stmt.all(locals.user.id);
    return json(passwords);
}

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { password, title, username } = await request.json();

        // Basic validation
        if (!password || !title) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const stmt = db.prepare("INSERT INTO passwords (user_id, title, username, password, updated_at) VALUES (?, ?, ?, ?, datetime('now'))");
        const info = stmt.run(locals.user.id, title, username || null, password);

        return json({ id: info.lastInsertRowid, success: true });
    } catch (err) {
        console.error('Database Error:', err);
        return json({ error: err.message }, { status: 500 });
    }
}

export async function PUT({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id, password, title, username } = await request.json();

    // Verify ownership
    const checkStmt = db.prepare('SELECT user_id FROM passwords WHERE id = ?');
    const record = checkStmt.get(id);

    if (!record || record.user_id !== locals.user.id) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    const stmt = db.prepare("UPDATE passwords SET password = ?, title = ?, username = ?, updated_at = datetime('now') WHERE id = ?");
    stmt.run(password, title, username || null, id);
    return json({ success: true });
}
