import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';

// Store challenges temporarily (in production, use Redis or similar)
const challenges = new Map();

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const options = await PasskeyAuth.generateRegistrationOptions(
            locals.user.id,
            locals.user.username
        );

        // Store challenge for verification
        challenges.set(locals.user.id, options.challenge);

        // Clear old challenges after 5 minutes
        setTimeout(() => {
            challenges.delete(locals.user.id);
        }, 5 * 60 * 1000);

        return json(options);
    } catch (error) {
        console.error('Passkey registration options error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}
