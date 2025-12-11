import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';
import { storeChallenge } from '$lib/server/challenge-store.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    try {
        const { username } = await request.json();

        console.log('Passkey auth requested for username:', username || '(usernameless)');

        let userId = null;

        // If username provided, get user ID for better UX
        if (username && username.trim()) {
            const db = (await import('$lib/server/db.js')).default;
            const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

            if (user) {
                userId = user.id;
                console.log('User found, ID:', user.id);

                const passkeys = db.prepare('SELECT id FROM passkey_credentials WHERE user_id = ?').all(user.id);
                console.log('User has', passkeys.length, 'passkey(s) registered');
            } else {
                console.error('User not found:', username);
            }
        }

        // Generate authentication options (works with or without userId)
        const options = await PasskeyAuth.generateAuthenticationOptions(userId);

        console.log('Authentication options generated:', {
            allowCredentials: options.allowCredentials?.length || 0,
            challenge: options.challenge.substring(0, 20) + '...'
        });

        // Store challenge - use a temporary ID if no userId
        const challengeKey = userId || 'usernameless_' + Date.now();
        storeChallenge(challengeKey, options.challenge);

        return json({ ...options, userId: challengeKey });
    } catch (error) {
        console.error('Passkey authentication options error:', error);
        return json({ error: 'Failed to generate authentication options' }, { status: 500 });
    }
}
