import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';
import { getChallenge, deleteChallenge } from '$lib/server/challenge-store.js';
import { Auth } from '$lib/server/auth.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    try {
        const { response, userId } = await request.json();
        const expectedChallenge = getChallenge(userId);

        if (!expectedChallenge) {
            console.error('Challenge not found for user:', userId);
            return json({ error: 'Challenge not found or expired' }, { status: 400 });
        }

        console.log('Verifying passkey authentication for user:', userId);

        const result = await PasskeyAuth.verifyAuthentication(
            response,
            expectedChallenge
        );

        // Clear challenge after use
        deleteChallenge(userId);

        if (result.success) {
            // Create session for the user
            const sessionId = Auth.createSession(result.userId);

            cookies.set('session_id', sessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: request.url.startsWith('https') || request.headers.get('x-forwarded-proto') === 'https',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            console.log('Passkey authentication successful for user:', result.userId);

            return json({
                success: true,
                message: 'Logged in successfully with passkey'
            });
        } else {
            return json({ error: 'Authentication verification failed' }, { status: 400 });
        }
    } catch (error) {
        console.error('Passkey authentication verify error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}
