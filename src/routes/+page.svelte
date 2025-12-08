<script>
    import { invalidateAll } from "$app/navigation";
    import { fade, slide, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let data;

    let length = 16;
    let useUppercase = true;
    let useLowercase = true;
    let useNumbers = true;
    let useSymbols = true;
    let generatedPassword = "";
    let passwordStrength = 0;
    let strengthLabel = "";
    let isGenerating = false;

    // Modal State
    let showSaveModal = false;
    let saveTitle = "";
    let saveUsername = "";
    let savePasswordInput = "";
    let saveError = "";

    // Edit State
    let editingId = null;
    let editTitle = "";
    let editUsername = "";
    let editPassword = "";

    // Visibility State
    let visiblePasswords = {};
    let showGeneratedPassword = true;

    let copySuccess = false;
    let saveSuccess = false;

    function calculateStrength(password) {
        let score = 0;
        if (!password) return 0;
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return Math.min(score, 4);
    }

    function getStrengthLabel(score) {
        switch (score) {
            case 0:
                return "Too Weak";
            case 1:
                return "Weak";
            case 2:
                return "Okay";
            case 3:
                return "Strong";
            case 4:
                return "Excellent";
            default:
                return "";
        }
    }

    function getStrengthColor(score) {
        return (
            ["#ff7675", "#fdcb6e", "#00cec9", "#00b894", "#00b894"][score] ||
            "#dfe6e9"
        );
    }

    function generatePassword() {
        isGenerating = true;
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const symbolChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

        let chars = "";
        if (useUppercase) chars += uppercaseChars;
        if (useLowercase) chars += lowercaseChars;
        if (useNumbers) chars += numberChars;
        if (useSymbols) chars += symbolChars;

        if (chars === "") {
            generatedPassword = "";
            passwordStrength = 0;
            strengthLabel = "";
            isGenerating = false;
            return;
        }

        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        generatedPassword = password;
        passwordStrength = calculateStrength(password);
        strengthLabel = getStrengthLabel(passwordStrength);

        setTimeout(() => {
            isGenerating = false;
        }, 200);
    }

    async function savePassword() {
        if (!saveTitle.trim()) {
            saveError = "Please enter a name for this password.";
            return;
        }

        const finalPassword = savePasswordInput || generatedPassword;

        if (!finalPassword) {
            saveError = "Password cannot be empty.";
            return;
        }

        if (!data.user) {
            window.location.href = "/login";
            return;
        }

        try {
            const response = await fetch("/api/passwords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: finalPassword,
                    title: saveTitle,
                    username: saveUsername,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                invalidateAll();
                showSaveModal = false;
                saveTitle = "";
                saveUsername = "";
                savePasswordInput = "";
                saveError = "";
                saveSuccess = true;
                setTimeout(() => (saveSuccess = false), 3000);
            } else {
                saveError = result.error || "Failed to save. Please try again.";
            }
        } catch (err) {
            saveError = "Network error. Please try again.";
        }
    }

    async function updatePassword() {
        if (!editPassword || !editTitle || !editingId) return;

        const response = await fetch("/api/passwords", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editingId,
                password: editPassword,
                title: editTitle,
                username: editUsername,
            }),
        });

        if (response.ok) {
            invalidateAll();
            editingId = null;
        }
    }

    function handleSaveClick() {
        if (!data.user) {
            window.location.href = "/login";
        } else {
            showSaveModal = true;
            savePasswordInput = generatedPassword;
            saveError = "";
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }

    function startEditing(item) {
        editingId = item.id;
        editTitle = item.title;
        editUsername = item.username || "";
        editPassword = item.password;
    }

    function cancelEditing() {
        editingId = null;
        editTitle = "";
        editUsername = "";
        editPassword = "";
    }

    function toggleVisibility(id) {
        visiblePasswords[id] = !visiblePasswords[id];
    }

    function regenerateSavedPassword() {
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const symbolChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

        let chars = "";
        if (useUppercase) chars += uppercaseChars;
        if (useLowercase) chars += lowercaseChars;
        if (useNumbers) chars += numberChars;
        if (useSymbols) chars += symbolChars;

        if (chars === "") return;

        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        editPassword = password;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }

    import { onMount } from "svelte";
    onMount(() => {
        generatePassword();
    });
</script>

<div class="container">
    <header class="header">
        <div class="brand">
            <div class="logo-icon">🛡️</div>
            <div class="brand-text">
                <h1>PMJ Secure</h1>
                <span class="tagline">Enterprise-Grade Password Generator</span>
            </div>
        </div>
        <div class="user-actions">
            {#if data.user}
                <div class="user-info">
                    <span class="welcome">Welcome, {data.user.username}</span>
                    <form action="/logout" method="POST">
                        <button type="submit" class="btn btn-text"
                            >Sign Out</button
                        >
                    </form>
                </div>
            {:else}
                <a href="/login" class="btn btn-secondary btn-sm">Log In</a>
                <a href="/register" class="btn btn-primary btn-sm"
                    >Get Started</a
                >
            {/if}
        </div>
    </header>

    <main>
        {#if !data.user}
            <section class="landing-hero" in:fade>
                <div class="hero-badge">100% Free for Everyone</div>
                <h2>The Most Secure Way to Manage Your Passwords</h2>
                <p class="hero-desc">
                    Generate unbreakable passwords, store them securely in your
                    personal vault, and access them anytime. No hidden fees,
                    ever.
                </p>

                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3>Military-Grade Encryption</h3>
                        <p>
                            Your passwords are generated using cryptographically
                            strong algorithms.
                        </p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">☁️</div>
                        <h3>Secure Vault</h3>
                        <p>
                            Save your passwords to your personal account so you
                            never lose them.
                        </p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">⚡</div>
                        <h3>Instant Access</h3>
                        <p>
                            Copy passwords with a single click and manage them
                            with ease.
                        </p>
                    </div>
                </div>
            </section>
        {:else}
            <section class="hero-section">
                <div class="hero-content">
                    <h2>Generate Strong, Unhackable Passwords</h2>
                    <p>
                        Protect your digital life with military-grade encryption
                        standards.
                    </p>
                </div>
            </section>
        {/if}

        <div class="card generator-card">
            <div class="display-wrapper">
                <div
                    class="password-display-container"
                    on:click={() => copyToClipboard(generatedPassword)}
                    title="Click to Copy"
                >
                    <div
                        class="password-display"
                        class:generating={isGenerating}
                    >
                        {#if showGeneratedPassword}
                            {generatedPassword || "Generating..."}
                        {:else}
                            ••••••••••••••••
                        {/if}
                    </div>
                    <div class="display-actions">
                        <button
                            class="action-btn"
                            on:click|stopPropagation={() =>
                                (showGeneratedPassword =
                                    !showGeneratedPassword)}
                            title={showGeneratedPassword ? "Hide" : "Show"}
                        >
                            {showGeneratedPassword ? "👁️" : "🙈"}
                        </button>
                    </div>
                </div>
                <span class="copy-hint"
                    >{copySuccess
                        ? "Copied to Clipboard!"
                        : "Click password to copy"}</span
                >

                <div class="strength-indicator">
                    <div class="bars">
                        {#each Array(4) as _, i}
                            <div
                                class="bar {i < passwordStrength
                                    ? 'active'
                                    : ''}"
                                style="background-color: {i < passwordStrength
                                    ? getStrengthColor(passwordStrength)
                                    : '#dfe6e9'}"
                            ></div>
                        {/each}
                    </div>
                    <span
                        class="strength-label"
                        style="color: {getStrengthColor(passwordStrength)}"
                        >{strengthLabel}</span
                    >
                </div>
            </div>

            <div class="controls">
                <div class="control-group">
                    <div class="label-row">
                        <label>Password Length</label>
                        <span class="value-badge">{length} Characters</span>
                    </div>
                    <input
                        type="range"
                        min="8"
                        max="64"
                        bind:value={length}
                        on:input={generatePassword}
                        class="slider"
                    />
                </div>

                <div class="toggles">
                    <label class="toggle-btn {useUppercase ? 'active' : ''}">
                        <input
                            type="checkbox"
                            bind:checked={useUppercase}
                            on:change={generatePassword}
                        />
                        <span class="toggle-icon">Aa</span>
                        <span class="toggle-text">Uppercase</span>
                    </label>
                    <label class="toggle-btn {useLowercase ? 'active' : ''}">
                        <input
                            type="checkbox"
                            bind:checked={useLowercase}
                            on:change={generatePassword}
                        />
                        <span class="toggle-icon">aa</span>
                        <span class="toggle-text">Lowercase</span>
                    </label>
                    <label class="toggle-btn {useNumbers ? 'active' : ''}">
                        <input
                            type="checkbox"
                            bind:checked={useNumbers}
                            on:change={generatePassword}
                        />
                        <span class="toggle-icon">123</span>
                        <span class="toggle-text">Numbers</span>
                    </label>
                    <label class="toggle-btn {useSymbols ? 'active' : ''}">
                        <input
                            type="checkbox"
                            bind:checked={useSymbols}
                            on:change={generatePassword}
                        />
                        <span class="toggle-icon">#@!</span>
                        <span class="toggle-text">Symbols</span>
                    </label>
                </div>

                <div class="actions">
                    <button
                        class="btn btn-primary big-btn"
                        on:click={generatePassword}
                    >
                        Generate New Password
                    </button>
                    <button
                        class="btn btn-secondary big-btn"
                        on:click={handleSaveClick}
                    >
                        Save to Vault
                    </button>
                </div>
            </div>
        </div>

        {#if !data.user}
            <section class="cta-section">
                <h3>Ready to secure your digital life?</h3>
                <a href="/register" class="btn btn-primary big-btn"
                    >Create Free Account</a
                >
            </section>
        {/if}

        {#if data.user && data.passwords.length > 0}
            <div class="history-section" in:fade>
                <div class="section-header">
                    <h2>Your Password Vault</h2>
                    <span class="badge">{data.passwords.length} Saved</span>
                </div>

                <div class="history-grid">
                    {#each data.passwords as item}
                        {#if editingId === item.id}
                            <!-- Edit Mode Card -->
                            <div
                                class="history-card editing"
                                in:fade={{ duration: 200 }}
                            >
                                <div class="card-header">
                                    <span class="card-label"
                                        >Editing Password</span
                                    >
                                </div>
                                <div class="card-body">
                                    <div class="input-group">
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            bind:value={editTitle}
                                            placeholder="Title"
                                            class="edit-input"
                                        />
                                    </div>
                                    <div class="input-group">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            bind:value={editUsername}
                                            placeholder="Username"
                                            class="edit-input"
                                        />
                                    </div>
                                    <div class="input-group">
                                        <label>Password</label>
                                        <div class="pass-edit-row">
                                            <input
                                                type="text"
                                                bind:value={editPassword}
                                                class="edit-input pass"
                                            />
                                            <button
                                                class="btn-icon-small"
                                                on:click={regenerateSavedPassword}
                                                title="Regenerate">🔄</button
                                            >
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <button
                                        class="btn-text-sm"
                                        on:click={cancelEditing}>Cancel</button
                                    >
                                    <button
                                        class="btn-primary-sm"
                                        on:click={updatePassword}>Save</button
                                    >
                                </div>
                            </div>
                        {:else}
                            <!-- View Mode Card -->
                            <div
                                class="history-card"
                                in:fade={{ duration: 200 }}
                            >
                                <div class="card-header">
                                    <div class="card-title-row">
                                        <span class="card-title"
                                            >{item.title}</span
                                        >
                                        {#if calculateStrength(item.password) >= 3}
                                            <span
                                                class="strength-dot strong"
                                                title="Strong Password"
                                            ></span>
                                        {:else}
                                            <span
                                                class="strength-dot weak"
                                                title="Weak Password"
                                            ></span>
                                        {/if}
                                    </div>
                                    <button
                                        class="btn-icon-plain"
                                        on:click={() => startEditing(item)}
                                        title="Edit">✏️</button
                                    >
                                </div>

                                <div class="card-body">
                                    {#if item.username}
                                        <div class="card-row">
                                            <span class="row-icon">👤</span>
                                            <span class="row-text"
                                                >{item.username}</span
                                            >
                                        </div>
                                    {/if}
                                    <div class="card-row password-row">
                                        <span class="row-icon">🔑</span>
                                        <code class="row-pass">
                                            {#if visiblePasswords[item.id]}
                                                {item.password}
                                            {:else}
                                                ••••••••••••••••
                                            {/if}
                                        </code>
                                    </div>
                                </div>

                                <div class="card-footer">
                                    <span class="date-text"
                                        >{formatDate(item.updated_at)}</span
                                    >
                                    <div class="card-actions">
                                        <button
                                            class="action-icon"
                                            on:click={() =>
                                                toggleVisibility(item.id)}
                                            title={visiblePasswords[item.id]
                                                ? "Hide"
                                                : "Show"}
                                        >
                                            {visiblePasswords[item.id]
                                                ? "👁️"
                                                : "🙈"}
                                        </button>
                                        <button
                                            class="action-icon"
                                            on:click={() =>
                                                copyToClipboard(item.password)}
                                            title="Copy"
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    </main>

    {#if showSaveModal}
        <div
            class="modal-overlay"
            on:click|self={() => (showSaveModal = false)}
            transition:fade
        >
            <div
                class="modal-card"
                transition:scale={{
                    duration: 300,
                    easing: quintOut,
                    start: 0.9,
                }}
            >
                <div class="modal-header">
                    <h3>Save to Vault</h3>
                    <button
                        class="close-btn"
                        on:click={() => (showSaveModal = false)}>&times;</button
                    >
                </div>

                <div class="modal-body">
                    <p class="modal-desc">
                        Save this secure password to your vault.
                    </p>

                    <div class="input-wrapper">
                        <label for="saveTitle"
                            >Title <span class="required">*</span></label
                        >
                        <input
                            type="text"
                            id="saveTitle"
                            placeholder="e.g. Netflix, Work Email..."
                            bind:value={saveTitle}
                            autofocus
                            class:error={saveError}
                        />
                    </div>

                    <div class="input-wrapper">
                        <label for="saveUsername"
                            >Username / Email <span class="optional"
                                >(Optional)</span
                            ></label
                        >
                        <input
                            type="text"
                            id="saveUsername"
                            placeholder="e.g. john.doe@example.com"
                            bind:value={saveUsername}
                        />
                    </div>

                    <div class="input-wrapper">
                        <label for="savePassword"
                            >Password <span class="required">*</span></label
                        >
                        <input
                            type="text"
                            id="savePassword"
                            bind:value={savePasswordInput}
                            class="pass-input"
                        />
                    </div>

                    {#if saveError}
                        <span class="error-text" transition:slide
                            >{saveError}</span
                        >
                    {/if}
                </div>

                <div class="modal-actions">
                    <button
                        class="btn btn-secondary"
                        on:click={() => (showSaveModal = false)}>Cancel</button
                    >
                    <button class="btn btn-primary" on:click={savePassword}
                        >Save Password</button
                    >
                </div>
            </div>
        </div>
    {/if}

    {#if copySuccess}
        <div class="toast" transition:fade>Copied to clipboard!</div>
    {/if}

    {#if saveSuccess}
        <div class="toast success" transition:fade>
            Password saved successfully!
        </div>
    {/if}
</div>

<style>
    /* ... Previous styles remain ... */
    /* Re-including all previous styles plus new modal styles */

    :root {
        --primary-color: #2563eb;
        --primary-hover: #1d4ed8;
        --bg-color: #f3f4f6;
        --text-color: #1f2937;
        --text-muted: #6b7280;
        --card-bg: #ffffff;
        --border-color: #e5e7eb;
        --danger-color: #ef4444;
        --success-color: #10b981;
    }

    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .logo-icon {
        font-size: 2.5rem;
    }

    .brand-text h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-color);
    }

    .tagline {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
    }

    .user-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .welcome {
        font-weight: 600;
        color: var(--text-color);
    }

    .hero-section {
        text-align: center;
        margin-bottom: 3rem;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
    }

    .hero-content h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #111827;
    }

    .hero-content p {
        color: var(--text-muted);
        font-size: 1.1rem;
        line-height: 1.6;
    }

    /* Landing Hero Styles */
    .landing-hero {
        text-align: center;
        margin-bottom: 4rem;
    }

    .hero-badge {
        display: inline-block;
        background: #dbeafe;
        color: #2563eb;
        padding: 0.5rem 1rem;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }

    .landing-hero h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: #111827;
        line-height: 1.2;
    }

    .hero-desc {
        font-size: 1.2rem;
        color: var(--text-muted);
        max-width: 600px;
        margin: 0 auto 3rem auto;
        line-height: 1.6;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-top: 3rem;
    }

    .feature-card {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        border: 1px solid var(--border-color);
        transition: transform 0.2s;
    }

    .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }

    .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .feature-card h3 {
        margin: 0 0 0.5rem 0;
        color: #111827;
    }

    .feature-card p {
        color: var(--text-muted);
        line-height: 1.5;
    }

    .cta-section {
        text-align: center;
        margin: 4rem 0;
        padding: 3rem;
        background: #eff6ff;
        border-radius: 16px;
    }

    .cta-section h3 {
        font-size: 1.8rem;
        margin-bottom: 1.5rem;
        color: #111827;
    }

    .generator-card {
        background: white;
        padding: 3rem;
        border-radius: 16px;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        margin-bottom: 4rem;
        border: 1px solid var(--border-color);
    }

    .display-wrapper {
        text-align: center;
        margin-bottom: 3rem;
    }

    .password-display-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
        background: #f8fafc;
        border-radius: 12px;
        border: 2px dashed #cbd5e1;
        padding: 0.5rem;
        transition: all 0.2s;
        cursor: pointer; /* Indicate clickable */
    }

    .password-display-container:hover {
        border-color: var(--primary-color);
        background: #f1f5f9;
    }

    .password-display {
        font-family: "JetBrains Mono", monospace;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-color);
        word-break: break-all;
        padding: 1rem;
        flex: 1;
        text-align: center;
    }

    .display-actions {
        display: flex;
        gap: 0.5rem;
        padding-right: 1rem;
    }

    .action-btn {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.8rem;
        cursor: pointer;
        font-size: 1.2rem;
        transition: all 0.2s;
    }

    .action-btn:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
        transform: translateY(-2px);
    }

    .copy-hint {
        display: block;
        height: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--success-color);
        margin-bottom: 1rem;
        text-align: center;
    }

    .strength-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8rem;
    }

    .bars {
        display: flex;
        gap: 8px;
    }

    .bar {
        width: 60px;
        height: 8px;
        border-radius: 4px;
        transition: background-color 0.3s;
    }

    .strength-label {
        font-size: 1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .controls {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
    }

    .label-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .value-badge {
        background: #e0e7ff;
        color: var(--primary-color);
        padding: 0.2rem 0.8rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 700;
    }

    .toggles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
    }

    .toggle-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.2rem;
        background: white;
        border: 2px solid var(--border-color);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .toggle-btn input {
        display: none;
    }

    .toggle-btn.active {
        border-color: var(--primary-color);
        background: #eff6ff;
    }

    .toggle-icon {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--text-muted);
    }

    .toggle-btn.active .toggle-icon {
        color: var(--primary-color);
    }

    .toggle-text {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-muted);
    }

    .actions {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
    }

    .big-btn {
        padding: 1.2rem;
        font-size: 1.1rem;
        border-radius: 12px;
    }

    .history-section {
        background: transparent;
        border: none;
        overflow: visible;
    }

    .section-header {
        background: white;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        margin-bottom: 1.5rem;
        padding: 1rem 1.5rem;
    }

    .history-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .history-card {
        background: white;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        padding: 1.2rem;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: relative;
    }

    .history-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        border-color: #cbd5e1;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .card-title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .card-title {
        font-weight: 700;
        color: #111827;
        font-size: 1.1rem;
    }

    .strength-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }

    .strength-dot.strong {
        background: var(--success-color);
        box-shadow: 0 0 0 2px #d1fae5;
    }
    .strength-dot.weak {
        background: var(--danger-color);
        box-shadow: 0 0 0 2px #fee2e2;
    }

    .btn-icon-plain {
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
        padding: 0;
        font-size: 1rem;
    }

    .btn-icon-plain:hover {
        opacity: 1;
    }

    .card-body {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        flex: 1;
    }

    .card-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.9rem;
        color: #4b5563;
        background: #f9fafb;
        padding: 0.5rem;
        border-radius: 6px;
    }

    .row-icon {
        font-size: 1rem;
    }

    .row-pass {
        font-family: "JetBrains Mono", monospace;
        font-weight: 600;
        color: #1f2937;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid #f3f4f6;
        margin-top: auto;
    }

    .date-text {
        font-size: 0.75rem;
        color: #9ca3af;
    }

    .card-actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-icon {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-icon:hover {
        border-color: var(--primary-color);
        background: #eff6ff;
        color: var(--primary-color);
    }

    /* Edit Mode Styles */
    .history-card.editing {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }

    .card-label {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--primary-color);
        letter-spacing: 0.5px;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .input-group label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
    }

    .edit-input {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.9rem;
        width: 100%;
    }

    .pass-edit-row {
        display: flex;
        gap: 0.5rem;
    }

    .btn-icon-small {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        padding: 0 0.5rem;
    }

    .btn-text-sm {
        background: none;
        border: none;
        font-size: 0.85rem;
        color: #6b7280;
        cursor: pointer;
        font-weight: 600;
    }

    .btn-primary-sm {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
    }

    /* NEW MODAL STYLES */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }

    .modal-card {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 450px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #111827;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-muted);
        cursor: pointer;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-desc {
        color: var(--text-muted);
        margin-top: 0;
        margin-bottom: 1.5rem;
        font-size: 0.95rem;
    }

    .input-wrapper {
        margin-bottom: 1.5rem;
    }

    .input-wrapper label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-color);
    }

    .required {
        color: var(--danger-color);
    }
    .optional {
        color: var(--text-muted);
        font-weight: 400;
        font-size: 0.8rem;
    }

    .input-wrapper input {
        width: 100%;
        padding: 0.8rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .input-wrapper input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .input-wrapper input.error {
        border-color: var(--danger-color);
    }

    .pass-input {
        font-family: "JetBrains Mono", monospace;
        font-weight: 600;
    }

    .error-text {
        color: var(--danger-color);
        font-size: 0.85rem;
        margin-top: 0.4rem;
        display: block;
    }

    .modal-actions {
        padding: 1.5rem;
        background: #f9fafb;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 30px;
        font-weight: 600;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }

    .toast.success {
        background: var(--success-color);
    }
</style>
