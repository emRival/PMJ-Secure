<script>
    import { invalidateAll } from "$app/navigation";
    import { jsPDF } from "jspdf";
    import autoTable from "jspdf-autotable";
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

    // Search State
    let searchQuery = "";

    $: filteredPasswords = data.passwords
        ? data.passwords.filter(
              (p) =>
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.username &&
                      p.username
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())),
          )
        : [];

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

    let showDeleteModal = false;
    let deleteId = null;

    function requestDelete(id) {
        deleteId = id;
        showDeleteModal = true;
    }

    async function confirmDelete() {
        if (!deleteId) return;

        const response = await fetch("/api/passwords", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: deleteId }),
        });

        if (response.ok) {
            invalidateAll();
            editingId = null;
            showDeleteModal = false;
            deleteId = null;
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

    // Sensitive Action Verification
    let showVerifyModal = false;
    let verifyPassword = "";
    let verifyError = "";
    let pendingAction = null; // { type: 'edit' | 'show' | 'copy', itemId: string, item: object }
    let verifiedSessionUntil = 0; // Timestamp when verification expires
    let timeRemaining = 0; // Seconds remaining

    import { onMount, onDestroy } from "svelte";

    onMount(() => {
        generatePassword();

        // Restore verification state from localStorage
        const storedVerify = localStorage.getItem("verifiedSessionUntil");
        if (storedVerify) {
            verifiedSessionUntil = parseInt(storedVerify, 10);
            updateTimer();
        }

        // Start timer loop
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    });

    function updateTimer() {
        const now = Date.now();
        if (now < verifiedSessionUntil) {
            timeRemaining = Math.floor((verifiedSessionUntil - now) / 1000);
        } else {
            timeRemaining = 0;
            // Optionally clear storage if expired
            if (verifiedSessionUntil > 0) {
                localStorage.removeItem("verifiedSessionUntil");
                verifiedSessionUntil = 0;
            }
        }
    }

    function isSessionVerified() {
        return Date.now() < verifiedSessionUntil;
    }

    function requireVerification(action) {
        if (isSessionVerified()) {
            performAction(action);
        } else {
            pendingAction = action;
            verifyPassword = "";
            verifyError = "";
            showVerifyModal = true;
        }
    }

    async function confirmVerify() {
        if (!verifyPassword) {
            verifyError = "Password is required";
            return;
        }

        try {
            const res = await fetch("/api/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: verifyPassword }),
            });

            const data = await res.json();

            if (!res.ok || !data.valid) {
                verifyError = "Incorrect password";
                return;
            }

            // Set expiry to 10 minutes from now
            verifiedSessionUntil = Date.now() + 10 * 60 * 1000;
            localStorage.setItem(
                "verifiedSessionUntil",
                verifiedSessionUntil.toString(),
            );
            updateTimer();

            showVerifyModal = false;
            if (pendingAction) {
                performAction(pendingAction);
                pendingAction = null;
            }
        } catch (err) {
            verifyError = "Verification failed. Try again.";
        }
    }

    function performAction(action) {
        if (action.type === "edit") {
            editingId = action.item.id;
            editTitle = action.item.title;
            editUsername = action.item.username || "";
            editPassword = action.item.password;
        } else if (action.type === "show") {
            visiblePasswords[action.itemId] = !visiblePasswords[action.itemId];
        } else if (action.type === "copy") {
            navigator.clipboard.writeText(action.text);
            copySuccess = true;
            setTimeout(() => (copySuccess = false), 2000);
        }
    }

    function startEditing(item) {
        requireVerification({ type: "edit", item });
    }

    function cancelEditing() {
        editingId = null;
        editTitle = "";
        editUsername = "";
        editPassword = "";
    }

    function toggleVisibility(id) {
        requireVerification({ type: "show", itemId: id });
    }

    function copyGeneratedPassword(text) {
        navigator.clipboard.writeText(text);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }

    function copyToClipboard(text) {
        requireVerification({ type: "copy", text });
    }

    function regenerateForEdit() {
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

    let showExportModal = false;
    let exportPassword = "";
    let exportError = "";

    function startExport() {
        showExportModal = true;
        exportPassword = "";
        exportError = "";
    }

    async function confirmExport() {
        if (!exportPassword) {
            exportError = "Password is required";
            return;
        }

        try {
            const res = await fetch("/api/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: exportPassword }),
            });

            const data = await res.json();

            if (!res.ok || !data.valid) {
                exportError = "Incorrect password";
                return;
            }

            await generatePDF(exportPassword);
            showExportModal = false;
        } catch (err) {
            exportError = "Verification failed. Try again.";
        }
    }

    async function generatePDF(password) {
        try {
            const response = await fetch("/api/export-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate PDF");
            }

            // Download the PDF
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "my-passwords.pdf";
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("PDF generation failed: " + e.message);
            console.error(e);
        }
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

    // Excel Bulk Generation State
    let excelProcessing = false;
    let excelError = "";
    let excelSuccessMsg = "";
    let processedWorkbook = null;
    let excelPreviewData = []; // To store data for the table preview
    let excelPasswordColIndex = -1; // To highlight the password column

    import * as XLSX from "xlsx";

    function generateSinglePassword(len, upper, lower, nums, syms) {
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const symbolChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

        let chars = "";
        if (upper) chars += uppercaseChars;
        if (lower) chars += lowercaseChars;
        if (nums) chars += numberChars;
        if (syms) chars += symbolChars;

        if (chars === "") return "";

        let password = "";
        let values = new Uint32Array(len);
        crypto.getRandomValues(values);
        for (let i = 0; i < len; i++) {
            password += chars.charAt(values[i] % chars.length);
        }
        return password;
    }

    function handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        excelProcessing = true;
        excelError = "";
        excelSuccessMsg = "";
        processedWorkbook = null;
        excelPreviewData = [];

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to array of arrays
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                });

                if (!jsonData || jsonData.length === 0) {
                    throw new Error("File appears to be empty.");
                }

                // Find 'password' header
                const headers = jsonData[0];
                const passColIndex = headers.findIndex(
                    (h) => h && h.toString().toLowerCase().includes("password"),
                );

                if (passColIndex === -1) {
                    throw new Error(
                        "Could not find a column with header 'password'. Please add one.",
                    );
                }
                excelPasswordColIndex = passColIndex;

                let count = 0;
                // Start from row 1 (users data)
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    // Check if row has any content to avoid filling infinite empty rows
                    if (
                        row &&
                        row.some(
                            (cell) =>
                                cell !== null &&
                                cell !== "" &&
                                cell !== undefined,
                        )
                    ) {
                        // Ensure row handles the column index
                        while (row.length <= passColIndex) {
                            row.push("");
                        }
                        // Generate password using current UI settings
                        row[passColIndex] = generateSinglePassword(
                            length,
                            useUppercase,
                            useLowercase,
                            useNumbers,
                            useSymbols,
                        );
                        count++;
                    }
                }

                if (count === 0) {
                    throw new Error("No data rows found to populate.");
                }

                // Convert back to sheet
                const newSheet = XLSX.utils.aoa_to_sheet(jsonData);
                workbook.Sheets[sheetName] = newSheet;
                processedWorkbook = workbook;
                excelPreviewData = jsonData; // Store all data for preview
                excelSuccessMsg = `Success! Generated passwords for ${count} rows.`;
            } catch (err) {
                console.error(err);
                excelError = err.message || "Failed to process Excel file.";
            } finally {
                excelProcessing = false;
                // Reset file input so same file can be selected again if needed
                event.target.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function downloadExcel() {
        if (!processedWorkbook) return;
        XLSX.writeFile(processedWorkbook, "passwords_filled.xlsx");
    }
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
            <!-- Theme Toggle -->
            <button
                class="btn btn-icon-plain"
                aria-label="Toggle Dark Mode"
                style="margin-right: 0.5rem;"
                on:click={() => {
                    if (document.documentElement.classList.contains("dark")) {
                        document.documentElement.classList.remove("dark");
                        localStorage.theme = "light";
                    } else {
                        document.documentElement.classList.add("dark");
                        localStorage.theme = "dark";
                    }
                }}
            >
                🌗
            </button>

            {#if data.user}
                <div class="user-info">
                    <span class="welcome">Welcome, {data.user.username}</span>
                    <a href="/account" class="btn btn-text">Account</a>
                    <button class="btn btn-text" on:click={startExport}
                        >Export PDF</button
                    >
                    <form
                        action="/logout"
                        method="POST"
                        on:submit={() => {
                            localStorage.removeItem("verifiedSessionUntil");
                        }}
                    >
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

    {#if timeRemaining > 0 && data.user}
        <div class="floating-timer">
            <span>🔓</span>
            <span
                >{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60)
                    .toString()
                    .padStart(2, "0")}</span
            >
        </div>
    {/if}

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
                    on:click={() => copyGeneratedPassword(generatedPassword)}
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

        <!-- Excel Bulk Generator Section -->
        <div class="card generator-card">
            <div
                class="section-header"
                style="margin-bottom: 1rem; padding: 0; box-shadow: none; border: none;"
            >
                <h2 style="font-size: 1.5rem;">Bulk Generate via Excel</h2>
            </div>
            <div class="excel-content">
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                    Upload an Excel file with a column named <strong
                        >password</strong
                    >. We will detect it, fill empty rows with secure passwords,
                    and let you download the result.
                </p>

                <div class="upload-wrapper">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        on:change={handleExcelUpload}
                        disabled={excelProcessing}
                        class="file-input"
                    />
                </div>

                {#if excelProcessing}
                    <div class="status-msg processing">Processing...</div>
                {:else if excelError}
                    <div class="status-msg error">{excelError}</div>
                {:else if excelSuccessMsg}
                    <div class="success-box" in:fade>
                        <div class="status-msg success">
                            ✅ {excelSuccessMsg}
                        </div>

                        {#if excelPreviewData.length > 0}
                            <div class="excel-table-wrapper">
                                <table class="excel-table">
                                    <thead>
                                        <tr>
                                            {#each excelPreviewData[0] as header, i}
                                                <th
                                                    class:highlight={i ===
                                                        excelPasswordColIndex}
                                                    >{header ||
                                                        `Col ${i + 1}`}</th
                                                >
                                            {/each}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each excelPreviewData.slice(1) as row}
                                            <!-- Only show rows that have data -->
                                            {#if row.some((cell) => cell !== null && cell !== "")}
                                                <tr>
                                                    {#each row as cell, i}
                                                        <td
                                                            class:highlight={i ===
                                                                excelPasswordColIndex}
                                                        >
                                                            {#if i === excelPasswordColIndex}
                                                                <span
                                                                    class="generated-preview"
                                                                    >{cell}</span
                                                                >
                                                            {:else}
                                                                {cell || ""}
                                                            {/if}
                                                        </td>
                                                    {/each}
                                                </tr>
                                            {/if}
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}

                        <button class="btn btn-primary" on:click={downloadExcel}
                            >Download Excel File</button
                        >
                    </div>
                {/if}
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
                    <div class="header-content">
                        <h2>Your Password Vault</h2>
                        <span class="badge">{data.passwords.length} Saved</span>
                    </div>
                    <div class="search-wrapper">
                        <span class="search-icon">🔍</span>
                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Search passwords..."
                            class="search-input"
                        />
                    </div>
                </div>

                <div class="history-grid">
                    {#each filteredPasswords as item}
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
                                    <button
                                        class="delete-icon-btn"
                                        on:click={() => requestDelete(item.id)}
                                        title="Delete Password"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <div class="card-body edit-body">
                                    <div class="edit-group">
                                        <label class="edit-label">Title</label>
                                        <input
                                            type="text"
                                            class="edit-input"
                                            bind:value={editTitle}
                                            placeholder="e.g. Gmail"
                                        />
                                    </div>
                                    <div class="edit-group">
                                        <label class="edit-label"
                                            >Username</label
                                        >
                                        <input
                                            type="text"
                                            class="edit-input"
                                            bind:value={editUsername}
                                            placeholder="Username (optional)"
                                        />
                                    </div>
                                    <div class="edit-group">
                                        <label class="edit-label"
                                            >Password</label
                                        >
                                        <div class="password-input-wrapper">
                                            <input
                                                type="text"
                                                class="edit-input password"
                                                bind:value={editPassword}
                                            />
                                            <button
                                                class="regen-btn"
                                                on:click={regenerateForEdit}
                                                title="Regenerate"
                                            >
                                                🔄
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer right-align">
                                    <button
                                        class="btn-text-sm"
                                        on:click={cancelEditing}>Cancel</button
                                    >
                                    <button
                                        class="btn-primary-sm"
                                        on:click={updatePassword}
                                        >Save Changes</button
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

    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div
            class="modal-overlay"
            transition:fade
            on:click={() => (showDeleteModal = false)}
        >
            <div class="modal delete-modal-content" on:click|stopPropagation>
                <div class="delete-icon-wrapper">
                    <span class="delete-warning-icon">⚠️</span>
                </div>
                <div class="delete-text-content">
                    <h3>Delete Password?</h3>
                    <p>
                        This action cannot be undone. Are you sure you want to
                        permanently delete this password?
                    </p>
                </div>
                <div class="delete-actions">
                    <button
                        class="btn-cancel"
                        on:click={() => (showDeleteModal = false)}
                        >Cancel</button
                    >
                    <button class="btn-confirm-delete" on:click={confirmDelete}
                        >Yes, Delete</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <!-- Export Confirmation Modal -->
    {#if showExportModal}
        <div
            class="modal-overlay"
            transition:fade
            on:click={() => (showExportModal = false)}
        >
            <div class="modal delete-modal-content" on:click|stopPropagation>
                <div
                    class="delete-icon-wrapper"
                    style="background: #e0e7ff; color: #4f46e5;"
                >
                    <span class="delete-warning-icon">🔒</span>
                </div>
                <div class="delete-text-content">
                    <h3>Export to PDF</h3>
                    <p>
                        Please enter your login password to encrypt the PDF
                        file.
                    </p>
                    <div
                        class="input-wrapper"
                        style="margin-top: 1rem; width: 100%; text-align: left;"
                    >
                        <input
                            type="password"
                            bind:value={exportPassword}
                            placeholder="Enter login password"
                            class:error={exportError}
                            style="width: 100%; padding: 0.8rem; border: 1px solid #d1d5db; border-radius: 8px;"
                        />
                        {#if exportError}
                            <span
                                class="error-text"
                                style="color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; display: block;"
                                >{exportError}</span
                            >
                        {/if}
                    </div>
                </div>
                <div class="delete-actions">
                    <button
                        class="btn-cancel"
                        on:click={() => (showExportModal = false)}
                        >Cancel</button
                    >
                    <button
                        class="btn-confirm-delete"
                        style="background: #4f46e5;"
                        on:click={confirmExport}>Export</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <!-- Verify Password Modal -->
    {#if showVerifyModal}
        <div
            class="modal-overlay"
            transition:fade
            on:click={() => (showVerifyModal = false)}
        >
            <div class="modal delete-modal-content" on:click|stopPropagation>
                <div
                    class="delete-icon-wrapper"
                    style="background: #e0e7ff; color: #4f46e5;"
                >
                    <span class="delete-warning-icon">🛡️</span>
                </div>
                <div class="delete-text-content">
                    <h3>Verify Identity</h3>
                    <p>
                        Please enter your login password to continue. Session
                        valid for 10 minutes.
                    </p>
                    <div
                        class="input-wrapper"
                        style="margin-top: 1rem; width: 100%; text-align: left;"
                    >
                        <input
                            type="password"
                            bind:value={verifyPassword}
                            placeholder="Enter login password"
                            class:error={verifyError}
                            style="width: 100%; padding: 0.8rem; border: 1px solid #d1d5db; border-radius: 8px;"
                        />
                        {#if verifyError}
                            <span
                                class="error-text"
                                style="color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; display: block;"
                                >{verifyError}</span
                            >
                        {/if}
                    </div>
                </div>
                <div class="delete-actions">
                    <button
                        class="btn-cancel"
                        on:click={() => (showVerifyModal = false)}
                        >Cancel</button
                    >
                    <button
                        class="btn-confirm-delete"
                        style="background: #4f46e5;"
                        on:click={confirmVerify}>Verify</button
                    >
                </div>
            </div>
        </div>
    {/if}

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
        padding: 1.25rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #111827;
        font-weight: 700;
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .badge {
        background: #e0e7ff;
        color: #4f46e5;
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.025em;
    }

    .search-wrapper {
        position: relative;
        flex: 1;
        min-width: 220px;
        max-width: 320px;
    }

    .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.9rem;
        color: #9ca3af;
        pointer-events: none;
    }

    .floating-timer {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: white;
        padding: 0.75rem 1.25rem;
        border-radius: 999px;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 50;
        font-weight: 500;
        color: var(--primary-color);
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .search-input {
        width: 100%;
        padding: 0.6rem 0.6rem 0.6rem 2.2rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .history-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        max-height: 600px; /* Limit height */
        overflow-y: auto; /* Enable vertical scrolling */
        padding: 0.5rem; /* Add padding for scrollbar space */
    }

    /* Custom Scrollbar for history grid */
    .history-grid::-webkit-scrollbar {
        width: 8px;
    }

    .history-grid::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
    }

    .history-grid::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
    }

    .history-grid::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
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
        z-index: 1; /* Ensure card content is clickable */
    }

    .modal-card {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 400px;
        box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        position: relative;
        z-index: 1001;
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
        transform: scale(1.1);
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
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
        opacity: 0.7;
    }

    .delete-icon-btn:hover {
        background: #fee2e2;
        opacity: 1;
    }

    .delete-modal {
        max-width: 400px;
        border-top: 4px solid var(--danger-color);
    }

    .btn-danger {
        background: var(--danger-color);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-danger:hover {
        background: #dc2626;
    }

    .card-footer.right-align {
        justify-content: flex-end;
        gap: 0.5rem;
    }

    /* NEW MODAL STYLES */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal {
        background: #ffffff; /* Explicitly white */
        border-radius: 16px;
        width: 90%;
        max-width: 400px;
        box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative; /* Ensure stacking context */
        z-index: 1001; /* Above overlay */
    }

    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .delete-icon-btn {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        padding: 8px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-icon-btn:hover {
        background: #fee2e2;
        transform: scale(1.1);
    }

    .delete-icon-btn:active {
        transform: scale(0.95);
    }

    .btn-primary-sm {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }

    .btn-primary-sm:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
    }

    .btn-primary-sm:active {
        transform: translateY(0);
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
    .edit-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0.5rem 0;
    }

    .edit-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        margin-bottom: 0.25rem;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .edit-input {
        width: 100%;
        padding: 0.6rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.95rem;
        transition: all 0.2s;
    }

    .edit-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }

    .edit-input.password {
        font-family: "JetBrains Mono", monospace;
        letter-spacing: -0.5px;
    }

    .password-input-wrapper {
        display: flex;
        gap: 0.5rem;
    }

    .regen-btn {
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        width: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .regen-btn:hover {
        background: #e5e7eb;
    }
    .delete-modal-content {
        padding: 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .delete-icon-wrapper {
        width: 64px;
        height: 64px;
        background: #fee2e2;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
    }

    .delete-warning-icon {
        font-size: 2rem;
    }

    .delete-text-content h3 {
        margin: 0 0 0.5rem 0;
        color: #111827;
        font-size: 1.25rem;
        font-weight: 700;
    }

    .delete-text-content p {
        margin: 0;
        color: #6b7280;
        font-size: 0.95rem;
        line-height: 1.5;
    }

    .delete-actions {
        display: flex;
        gap: 1rem;
        width: 100%;
        margin-top: 0.5rem;
    }

    .btn-cancel,
    .btn-confirm-delete {
        flex: 1;
        padding: 0.75rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    .btn-cancel {
        background: white;
        border: 1px solid #d1d5db;
        color: #374151;
    }

    .btn-cancel:hover {
        background: #f9fafb;
        border-color: #9ca3af;
    }

    .btn-confirm-delete {
        background: #dc2626;
        color: white;
        box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
        border-radius: 8px; /* Ensure radius matches button */
    }

    .btn-confirm-delete:hover {
        background: #b91c1c;
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(220, 38, 38, 0.4);
    }

    .btn-confirm-delete:active {
        transform: translateY(0);
    }

    /* Mobile Responsiveness & Polishing */
    @media (max-width: 768px) {
        .container {
            padding: 1rem;
            max-width: 100%;
        }

        .header {
            flex-direction: column;
            gap: 1.5rem;
            align-items: center;
            text-align: center;
            margin-bottom: 2rem;
        }

        .brand {
            justify-content: center;
        }

        .user-actions {
            flex-direction: column;
            width: 100%;
            gap: 0.8rem;
        }

        .user-info {
            flex-direction: column;
            width: 100%;
            gap: 0.8rem;
        }

        .user-actions .btn,
        .user-info .btn,
        .user-info form {
            width: 100%;
        }

        .user-info form .btn {
            width: 100%;
        }

        .hero-section h2,
        .landing-hero h2 {
            font-size: 1.8rem;
        }

        .generator-card {
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .features-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .password-display-container {
            flex-direction: column;
            gap: 0.5rem;
            padding: 1rem;
        }

        .password-display {
            font-size: 1.5rem; /* Smaller font for mobile */
            word-break: break-all;
            padding: 0.5rem;
        }

        .display-actions {
            padding-right: 0;
            justify-content: center;
            width: 100%;
        }

        .controls {
            gap: 2rem;
        }

        .toggles {
            grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile */
        }

        .actions {
            grid-template-columns: 1fr; /* Stack buttons */
        }

        .big-btn {
            padding: 1rem;
        }

        .section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            padding: 1rem;
        }

        .header-content {
            justify-content: space-between;
        }

        .search-wrapper {
            max-width: 100%;
        }

        .history-grid {
            grid-template-columns: 1fr; /* Single column for history cards */
            padding: 0.2rem;
        }

        .modal-card,
        .delete-modal-content {
            width: 95%;
            margin: 0 auto;
            max-height: 90vh;
            overflow-y: auto;
        }
    }

    @media (max-width: 480px) {
        .toggles {
            grid-template-columns: 1fr; /* 1 column for very small screens */
        }

        .password-display {
            font-size: 1.2rem;
        }
    }

    /* Excel Feature Styles */
    .excel-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .upload-wrapper {
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        transition: all 0.2s;
        background: #f9fafb;
    }

    .upload-wrapper:hover {
        border-color: var(--primary-color);
        background: #eff6ff;
    }

    .file-input {
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
    }

    .status-msg {
        padding: 1rem;
        border-radius: 8px;
        font-weight: 500;
        text-align: center;
    }

    .status-msg.processing {
        background: #eff6ff;
        color: var(--primary-color);
    }

    .status-msg.error {
        background: #fee2e2;
        color: var(--danger-color);
    }

    .success-box {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        background: #ecfdf5;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #a7f3d0;
        width: 100%;
        max-width: 100%;
    }

    .status-msg.success {
        background: transparent;
        color: var(--success-color);
        font-size: 1.1rem;
        font-weight: 600;
        padding: 0;
    }

    /* Excel Table Preview Styles */
    .excel-table-wrapper {
        width: 100%;
        max-height: 400px;
        overflow-y: auto;
        overflow-x: auto;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: white;
        margin-bottom: 1rem;
    }

    .excel-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
        text-align: left;
    }

    .excel-table th,
    .excel-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        white-space: nowrap;
    }

    .excel-table th {
        background: #f9fafb;
        font-weight: 600;
        color: #4b5563;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .excel-table th.highlight {
        background: #eff6ff;
        color: var(--primary-color);
        border-bottom: 2px solid var(--primary-color);
    }

    .excel-table td.highlight {
        background: #f8fafc;
        border-left: 2px solid transparent;
        border-right: 2px solid transparent;
    }

    .excel-table td.highlight:first-child {
        border-left: 2px solid var(--primary-color);
    }

    .generated-preview {
        font-family: "JetBrains Mono", monospace;
        color: var(--primary-color);
        font-weight: 600;
        background: #eff6ff;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        display: inline-block;
    }

    @media (max-width: 768px) {
        .excel-table {
            font-size: 0.8rem;
        }
        .excel-table th,
        .excel-table td {
            padding: 0.5rem;
        }
    }
</style>
