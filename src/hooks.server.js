import { Auth } from '$lib/server/auth';

export async function handle({ event, resolve }) {
    const sessionId = event.cookies.get('session_id');

    if (sessionId) {
        const session = Auth.getSession(sessionId);
        if (session) {
            event.locals.user = {
                id: session.user_id,
                username: session.username
            };
        }
    }

    return resolve(event);
}
