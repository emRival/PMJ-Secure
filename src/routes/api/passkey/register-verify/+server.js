import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';
import { getChallenge, deleteChallenge } from '$lib/server/challenge-store.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { response, name } = await request.json();
        const expectedChallenge = getChallenge(locals.user.id);

        if (!expectedChallenge) {
            console.error('Challenge not found for user:', locals.user.id);
            return json({ error: 'Challenge not found or expired' }, { status: 400 });
        }

        console.log('Verifying passkey registration for user:', locals.user.id);

        const result = await PasskeyAuth.verifyRegistration(
            locals.user.id,
            response,
            expectedChallenge,
            name || 'Passkey'
        );

        // Clear challenge after use
        deleteChallenge(locals.user.id);

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
