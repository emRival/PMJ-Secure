import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const rpName = 'PMJ Secure';
// For localhost, rpID must be 'localhost' without port
const rpID = process.env.RP_ID || 'localhost';
// Origin includes protocol and port for localhost
const origin = process.env.ORIGIN || 'http://localhost:5173';

export class PasskeyAuth {
    /**
     * Generate registration options for new passkey
     */
    static async generateRegistrationOptions(userId, username) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get existing credentials to exclude
        // DISABLED: To allow multiple passkeys (e.g. one on Mac, one on Android),
        // we should NOT exclude existing credentials. This allows "Add another device" flow.
        // const existingCredentials = db.prepare(
        //    'SELECT credential_id FROM passkey_credentials WHERE user_id = ?'
        // ).all(userId);

        // Convert userId string to Uint8Array
        const userIdBuffer = new TextEncoder().encode(userId);

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: userIdBuffer,
            userName: username,
            attestationType: 'none',
            excludeCredentials: [], // Allow multiple credentials
            // excludeCredentials: existingCredentials.map(cred => ({
            //     id: Buffer.from(cred.credential_id, 'base64'),
            //     type: 'public-key',
            //     transports: ['usb', 'ble', 'nfc', 'internal']
            // })),
            authenticatorSelection: {
                residentKey: 'required', // Make credential discoverable
                userVerification: 'preferred',
                // Don't specify authenticatorAttachment - let device decide
                // This allows both platform (built-in) and cross-platform (USB keys)
            }
        });

        return options;
    }

    /**
     * Verify and store passkey registration
     */
    static async verifyRegistration(userId, response, expectedChallenge, name = 'Passkey') {
        let verification;
        try {
            console.log('Verifying registration with:', {
                origin,
                rpID,
                expectedChallenge: expectedChallenge.substring(0, 20) + '...'
            });

            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                requireUserVerification: true
            });
        } catch (error) {
            console.error('Registration verification failed:', error);
            console.error('Error details:', {
                message: error.message,
                origin,
                rpID
            });
            throw new Error(`Failed to verify registration: ${error.message}`);
        }

        const { verified, registrationInfo } = verification;

        if (verified && registrationInfo) {
            const {
                credentialPublicKey,
                credentialID,
                counter
            } = registrationInfo;

            // Store credential in database
            const id = uuidv4();
            const credentialIdBase64 = Buffer.from(credentialID).toString('base64');
            const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64');

            db.prepare(`
                INSERT INTO passkey_credentials 
                (id, user_id, name, credential_id, credential_public_key, counter)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(id, userId, name, credentialIdBase64, publicKeyBase64, counter);

            console.log('Passkey registered successfully for user:', userId);
            return { success: true, credentialId: credentialIdBase64 };
        }

        return { success: false };
    }

    /**
     * Generate authentication options for passkey login
     */
    static async generateAuthenticationOptions(userId = null) {
        // Use usernameless/discoverable credentials flow
        // Don't specify allowCredentials - let the browser find matching credentials
        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'preferred'
        });

        return options;
    }

    /**
     * Verify passkey authentication
     */
    static async verifyAuthentication(response, expectedChallenge) {
        // Try different credential ID formats
        const credentialIdBase64 = Buffer.from(response.id, 'base64url').toString('base64');
        const credentialIdRaw = response.id;

        console.log('Looking for credential:', {
            base64: credentialIdBase64,
            base64url: credentialIdRaw,
            rawId: response.rawId ? Buffer.from(response.rawId).toString('base64') : 'N/A'
        });

        // Find credential in database - try base64 first
        let credential = db.prepare(
            'SELECT * FROM passkey_credentials WHERE credential_id = ?'
        ).get(credentialIdBase64);

        // If not found, try with rawId
        if (!credential && response.rawId) {
            const rawIdBase64 = Buffer.from(response.rawId).toString('base64');
            console.log('Trying rawId:', rawIdBase64);
            credential = db.prepare(
                'SELECT * FROM passkey_credentials WHERE credential_id = ?'
            ).get(rawIdBase64);
        }

        if (!credential) {
            // List all credentials for debugging
            const allCreds = db.prepare('SELECT credential_id, user_id FROM passkey_credentials').all();
            console.error('Credential not found. Available credentials:', allCreds);
            throw new Error('Credential not found');
        }

        console.log('Found credential for user:', credential.user_id);

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                authenticator: {
                    credentialID: Buffer.from(credential.credential_id, 'base64'),
                    credentialPublicKey: Buffer.from(credential.credential_public_key, 'base64'),
                    counter: credential.counter
                },
                requireUserVerification: true
            });
        } catch (error) {
            console.error('Authentication verification failed:', error);
            throw new Error('Failed to verify authentication');
        }

        const { verified, authenticationInfo } = verification;

        if (verified) {
            // Update counter and last used
            db.prepare(`
                UPDATE passkey_credentials 
                SET counter = ?, last_used_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(authenticationInfo.newCounter, credential.id);

            return { success: true, userId: credential.user_id };
        }

        return { success: false };
    }

    /**
     * Get all passkeys for a user
     */
    static getUserPasskeys(userId) {
        return db.prepare(`
            SELECT id, name, created_at, last_used_at 
            FROM passkey_credentials 
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).all(userId);
    }

    /**
     * Delete a passkey
     */
    static deletePasskey(passkeyId, userId) {
        const result = db.prepare(`
            DELETE FROM passkey_credentials 
            WHERE id = ? AND user_id = ?
        `).run(passkeyId, userId);

        return result.changes > 0;
    }
}
