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

        // Validate Username (Alphanumeric + Underscore only, 5-20 chars)
        const usernameRegex = /^[a-zA-Z0-9_]{5,20}$/;
        if (!usernameRegex.test(username)) {
            console.warn(`[AUTH] Failed registration attempt: Invalid username format (${username}) from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
            return fail(400, { error: 'Username must be 5-20 characters and contain only letters, numbers, or underscores.' });
        }

        // Validate Password (Strict Policy)
        // Min 8 chars, 1 uppercase, 1 number, 1 special char
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            console.warn(`[AUTH] Failed registration attempt: Weak password for user ${username} from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
            return fail(400, { error: 'Password must be at least 8 characters, include an uppercase letter, a number, and a special character.' });
        }

        try {
            const { id: userId } = await Auth.createUser(username, password);

            // Audit Log: Successful Registration
            console.log(`[AUTH] User Registered: ${username} (ID: ${userId}) from ${request.headers.get('x-forwarded-for') || 'unknown'} at ${new Date().toISOString()}`);

            const sessionId = Auth.createSession(userId);
            cookies.set('session_id', sessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: request.url.startsWith('https') || request.headers.get('x-forwarded-proto') === 'https',
                maxAge: 60 * 60 * 24 * 7
            });
        } catch (err) {
            console.error(`[AUTH] Registration Error for ${username}:`, err);
            return fail(500, { error: err.message || 'Internal Server Error' });
        }

        throw redirect(303, '/');
    }
};
