import { json } from '@sveltejs/kit';
import db from '$lib/server/db';

export function GET({ locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stmt = db.prepare('SELECT title, username, password, created_at, updated_at FROM passwords WHERE user_id = ? ORDER BY title ASC');
    const passwords = stmt.all(locals.user.id);

    return json(passwords);
}
