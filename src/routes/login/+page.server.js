import { fail, redirect } from '@sveltejs/kit';
import { Auth } from '$lib/server/auth';

export const actions = {
    login: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        if (!username || !password) {
            return fail(400, { error: 'Username and password are required' });
        }

        const user = await Auth.verifyUser(username, password);
        if (!user) {
            return fail(400, { error: 'Invalid username or password' });
        }

        const sessionId = Auth.createSession(user.id);
        cookies.set('session_id', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: request.url.startsWith('https') || request.headers.get('x-forwarded-proto') === 'https',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        throw redirect(303, '/');
    }
};
