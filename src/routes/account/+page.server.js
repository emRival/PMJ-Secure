import { fail, redirect } from '@sveltejs/kit';
import { Auth } from '$lib/server/auth';
import db from '$lib/server/db';
import bcrypt from 'bcryptjs';

export const load = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }
    return {
        user: locals.user
    };
};

export const actions = {
    updatePassword: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const data = await request.formData();
        const currentPassword = data.get('currentPassword');
        const newPassword = data.get('newPassword');
        const confirmPassword = data.get('confirmPassword');

        if (!currentPassword || !newPassword || !confirmPassword) {
            return fail(400, { error: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return fail(400, { error: 'New passwords do not match' });
        }

        if (newPassword.length < 6) {
            return fail(400, { error: 'New password must be at least 6 characters' });
        }

        // Verify current password
        const stmt = db.prepare('SELECT password_hash FROM users WHERE id = ?');
        const user = stmt.get(locals.user.id);

        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return fail(400, { error: 'Incorrect current password' });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        const updateStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        updateStmt.run(hash, locals.user.id);

        return { success: true, message: 'Password updated successfully' };
    }
};
