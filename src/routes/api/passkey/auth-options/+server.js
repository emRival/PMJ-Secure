import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';
import { storeChallenge } from '$lib/server/challenge-store.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { username } = await request.json();

        console.log('Passkey auth requested for username:', username);

        // Get user first to check if they have passkeys
        const db = (await import('$lib/server/db.js')).default;
        const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

        if (!user) {
            console.error('User not found:', username);
            // Don't reveal if user exists or not
            return json({ error: 'Authentication failed' }, { status: 400 });
        }

        console.log('User found, ID:', user.id);

        // Check if user has any passkeys
        const passkeys = db.prepare('SELECT id FROM passkey_credentials WHERE user_id = ?').all(user.id);
        console.log('User has', passkeys.length, 'passkey(s) registered');

        // Generate authentication options
        const options = await PasskeyAuth.generateAuthenticationOptions(user.id);

        console.log('Authentication options generated:', {
            allowCredentials: options.allowCredentials?.length || 0,
            challenge: options.challenge.substring(0, 20) + '...'
        });

        // Store challenge for verification
        storeChallenge(user.id, options.challenge);

        return json({ ...options, userId: user.id });
    } catch (error) {
        console.error('Passkey authentication options error:', error);
        return json({ error: 'Failed to generate authentication options' }, { status: 500 });
    }
}
