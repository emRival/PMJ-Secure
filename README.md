# PMJ Secure - Enterprise Grade Password Generator

PMJ Secure is a modern, secure, and open-source password generator and manager built with SvelteKit and SQLite. It features military-grade encryption, a secure personal vault, and a clean, professional user interface.

![PMJ Secure Preview](/static/og-image.png)

## ✨ Features

-   **Strong Password Generation**: Customizable length, character sets (uppercase, lowercase, numbers, symbols).
-   **Password Strength Meter**: Visual indicator of password strength.
-   **Secure Vault**: Save passwords with titles and optional usernames.
-   **Advanced Security**: 
    -   **Identity Verification**: Sensitive actions (view, edit, copy) require password re-entry.
    -   **Secure Session**: Verification remains valid for 10 minutes for convenience.
-   **Encrypted Export**: Export your password vault to a PDF file, fully encrypted with your login password.
-   **Search & Organize**: Easily find passwords with real-time search and filtering.
-   **User Authentication**: Secure Login and Registration system.
-   **Local Database**: Uses SQLite for fast and reliable data storage.
-   **Privacy Focused**: Passwords are hidden by default with toggle visibility.
-   **Responsive Design**: Works perfectly on desktop and mobile.
-   **Docker Ready**: Easy deployment with Docker and Docker Compose.

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
-   **Session Management**: Custom implementation using secure, `HttpOnly`, `SameSite=Strict` cookies to prevent XSS and CSRF attacks.
-   **Rate Limiting**: Custom middleware to prevent brute-force attacks on registration and login endpoints.

### Frontend & UI
-   **Vanilla CSS**: No heavy CSS frameworks (like Bootstrap or Tailwind). We use modern CSS variables and Flexbox/Grid for a custom, lightweight, and easily maintainable design system.
-   **`jspdf` & `jspdf-autotable`**: For generating secure, password-protected PDF backups directly in the browser.

## 🛡️ Security Architecture

We take security seriously. Here is how we protect your data:

1.  **Sudo Mode**: Sensitive actions (viewing, editing, or copying passwords) require you to re-enter your master password. This session stays active for 10 minutes, balancing security with convenience.
2.  **Encrypted Exports**: When you export your vault to PDF, the file is encrypted with AES-128 encryption using your master password. Even if someone steals the file, they cannot open it.
3.  **Local-First Design**: Your data lives on your server (or local machine), not in a third-party cloud. You own your data completely.

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
│   │   ├── +page.svelte     # Main application page
│   │   └── +layout.svelte   # Root layout
│   └── app.css              # Global styles
├── Dockerfile               # Docker build instructions
├── docker-compose.yml       # Docker Compose configuration
└── package.json             # Project dependencies
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
