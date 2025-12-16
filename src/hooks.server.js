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

    // Rate Limiting for Registration and Login
    if ((event.url.pathname === '/register' || event.url.pathname === '/login') && event.request.method === 'POST') {
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
                console.warn(`[SECURITY] Rate limit exceeded for IP ${ip} on ${event.url.pathname}`);
                return new Response(JSON.stringify({ error: 'Too many attempts. Please try again later.' }), {
                    status: 429,
                    headers: {
                        'Retry-After': '900',
                        'Content-Type': 'application/json'
                    }
                });
            }

            recentRequests.push(now);
            limiter.set(ip, recentRequests);
        } catch (e) {
            console.error('Rate limiting error:', e);
        }
    }

    const response = await resolve(event);

    // OWASP Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Content Security Policy (Basic)
    // allowing 'unsafe-inline' for Svelte styles/scripts often needed, but can be tightened later
    // Added Google Fonts support
    response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; frame-ancestors 'none';");

    // HSTS (Strict-Transport-Security) - Enable in Production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return response;
}
