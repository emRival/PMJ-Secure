import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';
import { storeChallenge } from '$lib/server/challenge-store.js';

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

        // Store challenge for verification using shared store
        storeChallenge(locals.user.id, options.challenge);

        console.log('Registration options generated, challenge stored for user:', locals.user.id);

        return json(options);
    } catch (error) {
        console.error('Passkey registration options error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}
