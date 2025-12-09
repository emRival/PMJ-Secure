<script>
    import "/src/app.css";
    import { onMount } from "svelte";

    export let data; // Access user data passed from layout.server.js

    let verifiedSessionUntil = 0;
    let timeRemaining = 0;

    onMount(() => {
        // Theme initialization logic
        if (
            localStorage.theme === "dark" ||
            (!("theme" in localStorage) &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }

        // --- GLOBAL VERIFICATION TIMER LOGIC ---
        // Restore verification state from localStorage
        const storedVerify = localStorage.getItem("verifiedSessionUntil");
        if (storedVerify) {
            verifiedSessionUntil = parseInt(storedVerify, 10);
            updateTimer();
        }

        // Start timer loop
        const interval = setInterval(updateTimer, 1000);

        // Proactively unregister any service workers
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .getRegistrations()
                .then(function (registrations) {
                    for (let registration of registrations) {
                        registration.unregister();
                    }
                });
        }

        return () => clearInterval(interval);
    });

    function updateTimer() {
        // Sync with localStorage so verifiedSessionUntil is always up to date even if updated in +page.svelte
        const storedVerify = localStorage.getItem("verifiedSessionUntil");
        if (storedVerify) {
            verifiedSessionUntil = parseInt(storedVerify, 10);
        } else {
            verifiedSessionUntil = 0;
        }

        const now = Date.now();
        if (now < verifiedSessionUntil) {
            timeRemaining = Math.floor((verifiedSessionUntil - now) / 1000);
        } else {
            timeRemaining = 0;
            if (verifiedSessionUntil > 0 && verifiedSessionUntil < now) {
                // Check if it's genuinely expired (smaller than now) to avoid clearing 0
                localStorage.removeItem("verifiedSessionUntil");
                verifiedSessionUntil = 0;
            }
        }
    }

    function toggleTheme() {
        if (document.documentElement.classList.contains("dark")) {
            document.documentElement.classList.remove("dark");
            localStorage.theme = "light";
        } else {
            document.documentElement.classList.add("dark");
            localStorage.theme = "dark";
        }
    }
</script>

<svelte:head>
    <script>
        // On page load or when changing themes, best to add inline in `head` to avoid FOUC
        if (
            localStorage.theme === "dark" ||
            (!("theme" in localStorage) &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    </script>
</svelte:head>

<!-- Global Floating Timer -->
{#if timeRemaining > 0 && data.user}
    <div class="floating-timer-global">
        <span>🔓</span>
        <span
            >{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60)
                .toString()
                .padStart(2, "0")}</span
        >
    </div>
{/if}

<slot />

<style>
    .floating-timer-global {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: white;
        padding: 0.75rem 1.25rem;
        border-radius: 999px;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 9999;
        font-weight: 500;
        color: #2563eb;
        animation: slideUp 0.3s ease-out;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
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
</style>
