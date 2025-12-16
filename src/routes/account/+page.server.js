import { fail, redirect } from '@sveltejs/kit';
import { Auth } from '$lib/server/auth';
import db from '$lib/server/db';
import bcrypt from 'bcryptjs';

export const load = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const is2FAEnabled = Auth.get2FAStatus(locals.user.id);

    return {
        user: locals.user,
        is2FAEnabled
    };
};

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./-=])[A-Za-z\d!@#$%^&*()_+~`|}{[\]:;?><,./-=]{8,}$/;

export const actions = {
    updatePassword: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const data = await request.formData();
        const currentPassword = data.get('currentPassword');
        const newPassword = data.get('newPassword');
        const confirmPassword = data.get('confirmPassword');

        if (!currentPassword || !newPassword || !confirmPassword) {
            return fail(400, { error: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return fail(400, { error: 'New passwords do not match' });
        }

        if (!PASSWORD_REGEX.test(newPassword)) {
            return fail(400, {
                error: 'Password must be at least 8 chars, with 1 uppercase, 1 number, and 1 symbol.'
            });
        }

        // Verify current password
        const stmt = db.prepare('SELECT password_hash FROM users WHERE id = ?');
        const user = stmt.get(locals.user.id);

        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return fail(400, { error: 'Incorrect current password' });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        const updateStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        updateStmt.run(hash, locals.user.id);

        return { passwordSuccess: true, passwordMessage: 'Password updated successfully' };
    },

    setup2FA: async ({ locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const secret = await Auth.create2FASecret(locals.user.id);
        const { authenticator } = await import('otplib');
        const QRCode = await import('qrcode');

        const otpauth = authenticator.keyuri(locals.user.username, 'PMJ Secure', secret);
        const qrCode = await QRCode.toDataURL(otpauth);

        return {
            qrCode,
            secret,
            twoFactorSetup: true, // Flag to indicate 2FA setup mode
            message: 'Scan the QR code with your authenticator app'
        };
    },

    verify2FA: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const data = await request.formData();
        const token = data.get('token');

        try {
            const success = await Auth.enable2FA(locals.user.id, token);
            if (!success) {
                return fail(400, { error2fa: 'Invalid code. Please try again.' });
            }
            return { twoFactorSuccess: true, twoFactorMessage: 'Two-Factor Authentication enabled successfully!' };
        } catch (err) {
            return fail(400, { error2fa: err.message });
        }
    },

    disable2FA: async ({ locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });
        await Auth.disable2FA(locals.user.id);
        return { twoFactorDisabled: true, twoFactorMessage: 'Two-Factor Authentication disabled.' };
    }
};
