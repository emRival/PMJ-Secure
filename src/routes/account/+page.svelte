<script>
    import { enhance } from "$app/forms";
    import { fade } from "svelte/transition";

    export let form;
    export let data;

    let showCurrent = false;
    let showNew = false;
    let showConfirm = false;
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
        color: #111827;
        margin: 0;
    }

    .settings-grid {
        display: grid;
        gap: 2rem;
    }

    .card {
        background: white;
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
        color: #111827;
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
</style>
