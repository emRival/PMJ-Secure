import { Auth } from '$lib/server/auth';

const limiter = new Map();

export async function handle({ event, resolve }) {
    // Session Authentication
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

    // Rate Limiting for Registration
    if (event.url.pathname === '/register' && event.request.method === 'POST') {
        try {
            const ip = event.getClientAddress();
            const now = Date.now();
            const windowMs = 15 * 60 * 1000; // 15 minutes
            const max = 5; // limit each IP to 5 requests per windowMs

            if (!limiter.has(ip)) {
                limiter.set(ip, []);
            }

            const requests = limiter.get(ip);
            const recentRequests = requests.filter(time => now - time < windowMs);

            if (recentRequests.length >= max) {
                return new Response('Too many account creation attempts. Please try again later.', { status: 429 });
            }

            recentRequests.push(now);
            limiter.set(ip, recentRequests);
        } catch (e) {
            console.error('Rate limiting error:', e);
        }
    }

    return await resolve(event);
}
