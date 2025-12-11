<script>
    import { enhance } from "$app/forms";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import { startRegistration } from "@simplewebauthn/browser";

    export let form;
    export let data;

    let showCurrent = false;
    let showNew = false;
    let showConfirm = false;

    // Passkey states
    let passkeys = [];
    let registeringPasskey = false;
    let passkeyError = "";
    let passkeySuccess = "";

    onMount(async () => {
        await loadPasskeys();
    });

    async function loadPasskeys() {
        try {
            const res = await fetch("/api/passkey");
            if (res.ok) {
                passkeys = await res.json();
            }
        } catch (err) {
            console.error("Failed to load passkeys:", err);
        }
    }

    async function registerPasskey() {
        registeringPasskey = true;
        passkeyError = "";
        passkeySuccess = "";

        try {
            // Get registration options from server
            const optionsRes = await fetch("/api/passkey/register-options", {
                method: "POST",
            });

            if (!optionsRes.ok) {
                throw new Error("Failed to get registration options");
            }

            const options = await optionsRes.json();

            // Start WebAuthn registration
            const attResp = await startRegistration(options);

            // Send response to server for verification
            const verifyRes = await fetch("/api/passkey/register-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: attResp }),
            });

            if (!verifyRes.ok) {
                throw new Error("Failed to verify registration");
            }

            passkeySuccess =
                "Passkey registered successfully! You can now login with biometrics.";
            await loadPasskeys();
        } catch (error) {
            console.error("Passkey registration error:", error);
            passkeyError =
                error.message ||
                "Failed to register passkey. Make sure your device supports biometrics.";
        } finally {
            registeringPasskey = false;
        }
    }

    async function deletePasskey(passkeyId) {
        if (!confirm("Are you sure you want to remove this passkey?")) {
            return;
        }

        try {
            const res = await fetch("/api/passkey", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ passkeyId }),
            });

            if (res.ok) {
                passkeySuccess = "Passkey removed successfully";
                await loadPasskeys();
            } else {
                throw new Error("Failed to delete passkey");
            }
        } catch (error) {
            console.error("Delete passkey error:", error);
            passkeyError = "Failed to remove passkey";
        }
    }
</script>

<div class="container">
    <header class="header">
        <a href="/" class="back-link">← Back to Vault</a>
        <h1>Account Settings</h1>
    </header>

    <div class="settings-grid">
        <!-- Profile Info Card -->
        <div class="card profile-card">
            <div class="card-header">
                <h2>Profile Information</h2>
            </div>
            <div class="card-body">
                <div class="info-group">
                    <label>Username</label>
                    <div class="static-value">{data.user.username}</div>
                    <span class="hint">Username cannot be changed</span>
                </div>
            </div>
        </div>

        <!-- Change Password Card -->
        <div class="card password-card">
            <div class="card-header">
                <h2>Change Password</h2>
            </div>
            <div class="card-body">
                <form method="POST" action="?/updatePassword" use:enhance>
                    <div class="form-group">
                        <label for="currentPassword">Current Password</label>
                        <div class="password-wrapper">
                            <input
                                type={showCurrent ? "text" : "password"}
                                id="currentPassword"
                                name="currentPassword"
                                required
                            />
                            <button
                                type="button"
                                class="toggle-btn"
                                on:click={() => (showCurrent = !showCurrent)}
                            >
                                {showCurrent ? "👁️" : "🙈"}
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <div class="password-wrapper">
                            <input
                                type={showNew ? "text" : "password"}
                                id="newPassword"
                                name="newPassword"
                                required
                                minlength="6"
                            />
                            <button
                                type="button"
                                class="toggle-btn"
                                on:click={() => (showNew = !showNew)}
                            >
                                {showNew ? "👁️" : "🙈"}
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="confirmPassword">Confirm New Password</label
                        >
                        <div class="password-wrapper">
                            <input
                                type={showConfirm ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                            />
                            <button
                                type="button"
                                class="toggle-btn"
                                on:click={() => (showConfirm = !showConfirm)}
                            >
                                {showConfirm ? "👁️" : "🙈"}
                            </button>
                        </div>
                    </div>

                    {#if form?.error}
                        <div class="alert error" transition:fade>
                            {form.error}
                        </div>
                    {/if}

                    {#if form?.success}
                        <div class="alert success" transition:fade>
                            {form.message}
                        </div>
                    {/if}

                    <button type="submit" class="btn btn-primary"
                        >Update Password</button
                    >
                </form>
            </div>
        </div>

        <!-- Two-Factor Authentication Card -->
        <div class="card two-factor-card">
            <div class="card-header">
                <h2>Two-Factor Authentication</h2>
            </div>
            <div class="card-body">
                {#if data.is2FAEnabled}
                    <div class="status-enabled">
                        <div class="icon">✅</div>
                        <p>2FA is currently enabled for your account.</p>
                    </div>

                    <form method="POST" action="?/disable2FA" use:enhance>
                        <button type="submit" class="btn btn-danger"
                            >Disable 2FA</button
                        >
                    </form>
                {:else}
                    <div class="status-disabled">
                        <p>
                            Protect your account with an extra layer of
                            security. When 2FA is enabled, you will need to
                            enter a code from your mobile authenticator app when
                            logging in.
                        </p>
                    </div>

                    {#if form?.qrCode}
                        <div class="setup-2fa">
                            <div class="qr-code">
                                <img src={form.qrCode} alt="2FA QR Code" />
                            </div>
                            <div class="secret-key">
                                <p>Or enter this secret key manually:</p>
                                <code>{form.secret}</code>
                            </div>

                            <form
                                method="POST"
                                action="?/verify2FA"
                                use:enhance
                                class="verify-form"
                            >
                                <div class="form-group">
                                    <label for="token"
                                        >Enter Code from App</label
                                    >
                                    <input
                                        type="text"
                                        name="token"
                                        placeholder="000 000"
                                        maxlength="6"
                                        required
                                        class="center-text"
                                    />
                                </div>
                                {#if form?.error2fa}
                                    <div class="alert error">
                                        {form.error2fa}
                                    </div>
                                {/if}
                                <button type="submit" class="btn btn-primary"
                                    >Verify & Enable</button
                                >
                            </form>
                        </div>
                    {:else}
                        <form method="POST" action="?/setup2FA" use:enhance>
                            <button type="submit" class="btn btn-primary"
                                >Enable 2FA</button
                            >
                        </form>
                    {/if}
                {/if}

                {#if form?.message && !form?.qrCode}
                    <div class="alert success" style="margin-top: 1rem;">
                        {form.message}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Passkey / Biometric Authentication Card -->
        <div class="card passkey-card">
            <div class="card-header">
                <h2>🔐 Passkey / Biometric Login</h2>
            </div>
            <div class="card-body">
                <div class="status-disabled">
                    <p>
                        Enable passwordless login using your device's biometrics
                        (fingerprint, Face ID, Windows Hello) or security keys.
                        Passkeys are more secure and convenient than traditional
                        passwords.
                    </p>
                </div>

                {#if passkeyError}
                    <div class="alert error" transition:fade>
                        {passkeyError}
                    </div>
                {/if}

                {#if passkeySuccess}
                    <div class="alert success" transition:fade>
                        {passkeySuccess}
                    </div>
                {/if}

                {#if passkeys.length > 0}
                    <div class="passkey-list">
                        <h3>Registered Passkeys</h3>
                        {#each passkeys as passkey}
                            <div class="passkey-item">
                                <div class="passkey-info">
                                    <div class="passkey-icon">🔑</div>
                                    <div>
                                        <div class="passkey-label">Passkey</div>
                                        <div class="passkey-date">
                                            Added: {new Date(
                                                passkey.created_at,
                                            ).toLocaleDateString()}
                                            {#if passkey.last_used_at}
                                                · Last used: {new Date(
                                                    passkey.last_used_at,
                                                ).toLocaleDateString()}
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    class="btn-delete-passkey"
                                    on:click={() => deletePasskey(passkey.id)}
                                    title="Remove this passkey"
                                >
                                    🗑️
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}

                <button
                    class="btn btn-primary"
                    on:click={registerPasskey}
                    disabled={registeringPasskey}
                >
                    {registeringPasskey
                        ? "⏳ Please use your biometric..."
                        : "➕ Add Passkey / Biometric"}
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header {
        margin-bottom: 2rem;
        position: relative;
        text-align: center;
    }

    .back-link {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
        text-decoration: none;
        font-weight: 500;
    }

    .back-link:hover {
        color: #2563eb;
    }

    h1 {
        font-size: 1.8rem;
        color: var(--text-color);
        margin: 0;
    }

    .settings-grid {
        display: grid;
        gap: 2rem;
    }

    .card {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
    }

    .card-header {
        background: #f9fafb;
        padding: 1.2rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .card-header h2 {
        margin: 0;
        font-size: 1.1rem;
        color: #374151;
    }

    .card-body {
        padding: 1.5rem;
    }

    .info-group label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }

    .static-value {
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--text-color);
        padding: 0.5rem 0;
    }

    .hint {
        font-size: 0.85rem;
        color: #9ca3af;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #374151;
        font-size: 0.9rem;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s;
    }

    input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .password-wrapper {
        position: relative;
    }

    .toggle-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        opacity: 0.6;
    }

    .alert {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-weight: 500;
    }

    .alert.error {
        background: #fee2e2;
        color: #dc2626;
    }

    .alert.success {
        background: #d1fae5;
        color: #059669;
    }

    .btn-primary {
        width: 100%;
        padding: 0.85rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-primary:hover {
        background: #1d4ed8;
    }

    .btn-danger {
        width: 100%;
        padding: 0.85rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-danger:hover {
        background: #dc2626;
    }

    .setup-2fa {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        text-align: center;
    }

    .qr-code {
        background: var(--card-bg);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .qr-code img {
        display: block;
        max-width: 200px;
        height: auto;
    }

    .secret-key {
        background: #f3f4f6;
        padding: 1rem;
        border-radius: 8px;
        width: 100%;
    }

    .secret-key p {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #6b7280;
    }

    .secret-key code {
        font-family: "JetBrains Mono", monospace;
        font-weight: 600;
        color: #1f2937;
        font-size: 1.1rem;
        word-break: break-all;
    }

    .verify-form {
        width: 100%;
    }

    .status-enabled {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        text-align: center;
        margin-bottom: 1.5rem;
        background: #ecfdf5;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #a7f3d0;
    }

    .status-enabled .icon {
        font-size: 2rem;
    }

    .status-enabled p {
        margin: 0;
        color: #065f46;
        font-weight: 500;
    }

    .status-disabled {
        margin-bottom: 1.5rem;
        color: #6b7280;
        font-size: 0.95rem;
        line-height: 1.6;
    }

    .center-text {
        text-align: center;
        letter-spacing: 0.2rem;
        font-size: 1.5rem;
    }

    /* Passkey Styles */
    .passkey-list {
        margin: 1.5rem 0;
    }

    .passkey-list h3 {
        font-size: 0.95rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }

    .passkey-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-bottom: 0.75rem;
    }

    .passkey-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .passkey-icon {
        font-size: 1.5rem;
    }

    .passkey-label {
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 0.25rem;
    }

    .passkey-date {
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    .btn-delete-passkey {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        opacity: 0.6;
        transition: all 0.2s;
    }

    .btn-delete-passkey:hover {
        opacity: 1;
        transform: scale(1.1);
    }

    /* Dark Mode Overrides for Account Page */
    :global(.dark) .secret-key {
        background: #374151;
    }
    :global(.dark) .secret-key code {
        color: #e5e7eb;
    }
    :global(.dark) .status-enabled {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
    }
    :global(.dark) .status-enabled p {
        color: #34d399;
    }
</style>
