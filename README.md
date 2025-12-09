# PMJ Secure - Enterprise Grade Password Generator

PMJ Secure is a modern, secure, and open-source password generator and manager built with SvelteKit and SQLite. It features military-grade encryption, a secure personal vault, and a clean, professional user interface.

![PMJ Secure Preview](/static/og-image.png)

## ✨ Features

-   **Strong Password Generation**: Customizable length, character sets (uppercase, lowercase, numbers, symbols).
-   **Password Strength Meter**: Visual indicator of password strength.
-   **Secure Vault**: Save passwords with titles and optional usernames.
-   **Advanced Security**: 
    -   **Two-Factor Authentication (2FA)**: Secure login and password reset using TOTP (Google Authenticator, Authy, etc.).
    -   **Identity Verification**: Sensitive actions (view, edit, copy) require password re-entry.
    -   **Secure Session**: Verification remains valid for 10 minutes for convenience.
-   **Encrypted Export**: Export your password vault to a PDF file, fully encrypted with your login password.
-   **Excel Support**: Import and Export passwords via Excel files for easy migration.
-   **Dark Mode**: Elegant dark theme toggle for comfortable night usage.
-   **Search & Organize**: Easily find passwords with real-time search and filtering.
-   **User Authentication**: Secure Login and Registration system.
-   **Local Database**: Uses SQLite for fast and reliable data storage.
-   **Privacy Focused**: Passwords are hidden by default with toggle visibility.
-   **Responsive Design**: Works perfectly on desktop and mobile.
-   **Docker Ready**: Easy deployment with Docker and Docker Compose.

## 🔄 How to Update

To update the application to the latest version on your server (LXC/Docker), follow these simple steps:

1.  **Pull the latest code**
    ```bash
    git pull origin main
    ```

2.  **Rebuild and Restart Container**
    ```bash
    docker-compose down
    docker-compose up -d --build
    ```

3.  **Verify Update**
    Check the application logs to ensure everything started correctly:
    ```bash
    docker-compose logs -f
    ```

## 📖 User Guide & Key Workflows

### 1. Smart Password Generation
On the main dashboard, you can generate strong random passwords instantly.
-   **Customization**: Adjust length (up to 64 chars) and include/exclude Uppercase, Lowercase, Numbers, and Symbols.
-   **One-Click Copy**: Click the generated password card to copy it immediately. No verification needed for newly generated passwords.

### 2. The Secure Vault
Save your important credentials to your personal encrypted vault.
-   **Organization**: specific titles and usernames for each entry.
-   **Privacy**: Passwords are hidden (`••••••`) by default.
-   **Search**: Real-time filtering to find credentials quickly.

### 3. Identity Verification ("Sudo Mode")
To protect your most sensitive data, PMJ Secure implements a smart verification system.
-   **Trigger**: When you try to **View**, **Edit**, or **Copy** a saved password from the vault, you will be asked to re-enter your login password.
-   **10-Minute Session**: Once verified, you enter a "Unlock Mode" for 10 minutes.
-   **Global Floating Timer**: A floating timer (e.g., `🔓 9:45`) appears at the bottom-right of your screen, letting you know how much time you have left.
-   **Persistence**: You can refresh the page or navigate away, and your unlock session will remain active until the timer runs out.
-   **Auto-Lock**: When the timer hits 0, or if you click **Sign Out**, the vault automatically locks again.

### 4. Encrypted Backups
-   **PDF Export**: Download a printable backup of your vault. **Crucially, this PDF is encrypted** with your login password. You cannot open it without the password.
-   **Excel Import/Export**: Easily migrate your data in bulk.

## 🏗️ Architecture & Technology Stack

PMJ Secure is built with performance, security, and simplicity in mind. We chose a modern stack that delivers a lightning-fast user experience while maintaining robust security standards.

### Core Framework
-   **[SvelteKit](https://kit.svelte.dev/)**: The meta-framework for Svelte. We use SvelteKit for its hybrid rendering capabilities (SSR + CSR), which provides:
    -   **Zero-compromise performance**: Smaller bundle sizes compared to React/Vue.
    -   **Server-Side Rendering (SSR)**: For fast initial page loads and SEO.
    -   **API Routes**: Integrated backend logic without needing a separate server.

### Backend & Database
-   **Node.js**: The runtime environment for our server-side logic.
-   **SQLite (`better-sqlite3`)**: A high-performance, serverless SQL database.
    -   *Why SQLite?* It allows the entire application to be self-contained in a single Docker container, making backups as simple as copying a file (`passwords.db`). No complex database setup required.

### Security & Authentication
-   **`bcryptjs`**: Industry-standard library for hashing user passwords. We never store plain-text passwords.
-   **`otplib` & `qrcode`**: Standards-compliant libraries for generating and verifying TOTP codes for 2FA.
-   **Session Management**: Custom implementation using secure, `HttpOnly`, `SameSite=Strict` cookies to prevent XSS and CSRF attacks.
-   **Rate Limiting**: Custom middleware to prevent brute-force attacks on registration and login endpoints.

### Frontend & UI
-   **Vanilla CSS**: No heavy CSS frameworks (like Bootstrap or Tailwind). We use modern CSS variables and Flexbox/Grid for a custom, lightweight, and easily maintainable design system.
-   **Dark Mode**: Native CSS variables implementation with local storage persistence.
-   **`jspdf` & `xlsx`**: Client-side libraries for handling PDF and Excel files ensuring data stays local.

## 🛡️ Security Architecture

We take security seriously. Here is how we protect your data:

1.  **Two-Factor Authentication (2FA)**: Adds a critical second layer of defense. Even if your password is stolen, an attacker cannot access your account without your physical device. We also support **Emergency Password Reset** via 2FA.
2.  **Sudo Mode**: Sensitive actions (viewing, editing, or copying passwords) require you to re-enter your master password. This session stays active for 10 minutes, balancing security with convenience.
3.  **Encrypted Exports**: When you export your vault to PDF, the file is encrypted with AES-128 encryption using your master password. Even if someone steals the file, they cannot open it.
4.  **Local-First Design**: Your data lives on your server (or local machine), not in a third-party cloud. You own your data completely.

## 🚀 Getting Started (Local Development)

### Prerequisites

-   Node.js (v18 or higher)
-   npm (or pnpm/yarn)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/emRival/PMJ-Secure.git
    cd random-password-generator
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open your browser**
    Navigate to `http://localhost:5173`.

## 🐳 Deployment (Docker)

This project is optimized for deployment using Docker and Docker Compose.

### Quick Start with Docker Compose

1.  **Clone the repository** to your server.

2.  **Configure Environment (Optional)**
    The application is configured to work with both direct IP access (LXC/HTTP) and Domain access (HTTPS) automatically.
    
    If you need to enforce a specific origin, you can uncomment `ORIGIN` in `docker-compose.yml`, but leaving it commented out is recommended for hybrid environments.

3.  **Run the container**
    ```bash
    docker-compose up -d --build
    ```

The application will be available at `http://localhost:3009` (or your server's IP:3009).

### Using Nginx Proxy Manager

If you are using Nginx Proxy Manager (NPM) to expose the app:

1.  Run the container as shown above.
2.  In NPM, create a new **Proxy Host**.
3.  Set **Forward Hostname / IP** to your Docker host IP.
4.  Set **Forward Port** to `3009` (default configured in docker-compose).
5.  Enable **Websockets Support** (optional but recommended).
6.  Request a **Let's Encrypt SSL Certificate** and enable "Force SSL".
7.  **Important**: Update the `ORIGIN` in `docker-compose.yml` to your full HTTPS domain (e.g., `https://passwords.example.com`) and restart the container.

## 📂 Project Structure

```
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.js      # Authentication logic
│   │   │   └── db.js        # Database connection
│   ├── routes/
│   │   ├── api/             # API endpoints
│   │   ├── login/           # Login page
│   │   ├── register/        # Register page
│   │   ├── reset-password/  # Password reset page
│   │   ├── +page.svelte     # Main application page
│   │   └── +layout.svelte   # Root layout
│   └── app.css              # Global styles
├── Dockerfile               # Docker build instructions
├── docker-compose.yml       # Docker Compose configuration
└── package.json             # Project dependencies
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
