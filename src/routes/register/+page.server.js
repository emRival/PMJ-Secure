import { fail, redirect } from '@sveltejs/kit';
import { Auth } from '$lib/server/auth';

export const actions = {
    register: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        if (!username || !password) {
            return fail(400, { error: 'Username and password are required' });
        }

        if (username.length < 5) {
            return fail(400, { error: 'Username must be at least 5 characters long' });
        }

        try {
            const { id: userId } = await Auth.createUser(username, password);
            const sessionId = Auth.createSession(userId);
            cookies.set('session_id', sessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7
            });
        } catch (err) {
            return fail(400, { error: err.message });
        }

        throw redirect(303, '/');
    }
};
