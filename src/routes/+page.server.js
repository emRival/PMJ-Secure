import db from '$lib/server/db';

export function load({ locals }) {
    let passwords = [];
    if (locals.user) {
        const stmt = db.prepare('SELECT * FROM passwords WHERE user_id = ? ORDER BY created_at DESC');
        passwords = stmt.all(locals.user.id);
    }

    return {
        passwords,
        user: locals.user
    };
}
