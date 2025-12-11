import { json } from '@sveltejs/kit';
import { PasskeyAuth } from '$lib/server/passkey.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const passkeys = PasskeyAuth.getUserPasskeys(locals.user.id);
        return json(passkeys);
    } catch (error) {
        console.error('Get passkeys error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { passkeyId } = await request.json();
        const deleted = PasskeyAuth.deletePasskey(passkeyId, locals.user.id);

        if (deleted) {
            return json({ success: true, message: 'Passkey deleted' });
        } else {
            return json({ error: 'Passkey not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Delete passkey error:', error);
        return json({ error: error.message }, { status: 500 });
    }
}
