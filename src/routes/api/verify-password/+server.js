import { json } from '@sveltejs/kit';
import { Auth } from '$lib/server/auth';
import db from '$lib/server/db';
import bcrypt from 'bcryptjs';

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password) {
        return json({ error: 'Password is required' }, { status: 400 });
    }

    const stmt = db.prepare('SELECT password_hash FROM users WHERE id = ?');
    const user = stmt.get(locals.user.id);

    if (!user) {
        return json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
        return json({ valid: false }, { status: 400 });
    }

    return json({ valid: true });
}
