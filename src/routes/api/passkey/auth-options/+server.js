import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';
import { storeChallenge } from '$lib/server/challenge-store.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { username } = await request.json();

        // Get user first to check if they have passkeys
        const db = (await import('$lib/server/db.js')).default;
        const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

        if (!user) {
            // Don't reveal if user exists or not
            return json({ error: 'Authentication failed' }, { status: 400 });
        }

        // Generate authentication options
        const options = await PasskeyAuth.generateAuthenticationOptions(user.id);

        // Store challenge for verification
        storeChallenge(user.id, options.challenge);

        console.log('Authentication options generated for user:', user.id);

        return json({ ...options, userId: user.id });
    } catch (error) {
        console.error('Passkey authentication options error:', error);
        return json({ error: 'Failed to generate authentication options' }, { status: 500 });
    }
}
