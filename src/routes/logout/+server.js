import { redirect } from '@sveltejs/kit';
import { Auth } from '$lib/server/auth';

export const POST = async ({ cookies }) => {
    const sessionId = cookies.get('session_id');
    if (sessionId) {
        Auth.deleteSession(sessionId);
        cookies.delete('session_id', { path: '/' });
    }
    throw redirect(303, '/login');
};
