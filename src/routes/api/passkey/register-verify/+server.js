import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';

// Import challenges map from register-options (in production use shared store)
const challenges = new Map();

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { response } = await request.json();
        const expectedChallenge = challenges.get(locals.user.id);

        if (!expectedChallenge) {
            return json({ error: 'Challenge not found or expired' }, { status: 400 });
        }

        const result = await PasskeyAuth.verifyRegistration(
            locals.user.id,
            response,
            expectedChallenge
        );

        // Clear challenge after use
        challenges.delete(locals.user.id);

        if (result.success) {
            return json({ success: true, message: 'Passkey registered successfully' });
        } else {
            return json({ error: 'Registration verification failed' }, { status: 400 });
        }
    } catch (error) {
        console.error('Passkey registration verify error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}
