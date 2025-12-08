import { fail, redirect } from '@sveltejs/kit';
import { Auth } from '$lib/server/auth';

export const actions = {
    reset: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = data.get('username');
        const token = data.get('token');
        const newPassword = data.get('newPassword');

        if (!username || !token || !newPassword) {
            return fail(400, { error: 'All fields are required' });
        }

        if (newPassword.length < 6) {
            return fail(400, { error: 'Password must be at least 6 characters' });
        }

        try {
            const userId = await Auth.resetPasswordWith2FA(username, token, newPassword);

            // Auto login user after successful reset
            const sessionId = Auth.createSession(userId);
            cookies.set('session_id', sessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: request.url.startsWith('https') || request.headers.get('x-forwarded-proto') === 'https',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            throw redirect(303, '/');
        } catch (err) {
            if (err.status === 303) throw err; // Re-throw redirect
            return fail(400, { error: err.message });
        }
    }
};
