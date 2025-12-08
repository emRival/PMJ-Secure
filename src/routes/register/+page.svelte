<script>
    import { fade } from "svelte/transition";
    import { enhance } from "$app/forms";
    export let form;

    let showPassword = false;
</script>

<div class="container">
    <div class="auth-card">
        <div class="header">
            <a href="/" class="back-link">← Back to Home</a>
            <div class="logo">🛡️</div>
            <h1>Join PMJ Secure</h1>
            <p class="subtitle">
                Create your free account to start saving passwords.
            </p>
        </div>

        <form method="POST" action="?/register" use:enhance>
            <div class="form-group">
                <label for="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Choose a unique username"
                    required
                    minlength="5"
                />
                <span class="hint">Minimum 5 characters</span>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <div class="password-wrapper">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="Create a strong password"
                        required
                    />
                    <button
                        type="button"
                        class="toggle-btn"
                        on:click={() => (showPassword = !showPassword)}
                        tabindex="-1"
                    >
                        {showPassword ? "👁️" : "🙈"}
                    </button>
                </div>
            </div>

            {#if form?.error}
                <div class="error" transition:fade>{form.error}</div>
            {/if}

            <button type="submit" class="btn-submit">Create Account</button>
        </form>

        <div class="footer">
            <p>Already have an account? <a href="/login">Log in</a></p>
        </div>
    </div>
</div>

<style>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
        padding: 1rem;
    }

    .auth-card {
        background: white;
        padding: 2.5rem;
        border-radius: 16px;
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
        border: 1px solid #e5e7eb;
    }

    .header {
        text-align: center;
        margin-bottom: 2rem;
        position: relative;
    }

    .back-link {
        position: absolute;
        left: 0;
        top: 0;
        font-size: 0.9rem;
        color: #6b7280;
        text-decoration: none;
    }

    .back-link:hover {
        color: #2563eb;
        text-decoration: underline;
    }

    .logo {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #111827;
    }

    .subtitle {
        color: #6b7280;
        margin-top: 0.5rem;
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
        transition: opacity 0.2s;
    }

    .toggle-btn:hover {
        opacity: 1;
    }

    .hint {
        font-size: 0.8rem;
        color: #6b7280;
        margin-top: 0.3rem;
        display: block;
    }

    .btn-submit {
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

    .btn-submit:hover {
        background: #1d4ed8;
    }

    .error {
        background: #fee2e2;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
        text-align: center;
    }

    .footer {
        text-align: center;
        margin-top: 1.5rem;
        font-size: 0.9rem;
        color: #6b7280;
    }

    a {
        color: #2563eb;
        text-decoration: none;
        font-weight: 600;
    }

    a:hover {
        text-decoration: underline;
    }

    @media (max-width: 480px) {
        .auth-card {
            padding: 1.5rem;
        }

        .logo {
            font-size: 2.5rem;
        }

        h1 {
            font-size: 1.25rem;
        }
    }
</style>
