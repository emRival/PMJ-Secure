# PMJ Secure - Enterprise Grade Password Generator

PMJ Secure is a modern, secure, and open-source password generator and manager built with SvelteKit and SQLite. It features military-grade encryption, a secure personal vault, and a clean, professional user interface.

![PMJ Secure Preview](/static/og-image.png)

## ✨ Features

-   **Strong Password Generation**: Customizable length, character sets (uppercase, lowercase, numbers, symbols).
-   **Password Strength Meter**: Visual indicator of password strength.
-   **Secure Vault**: Save passwords with titles and optional usernames.
-   **User Authentication**: Secure Login and Registration system.
-   **Local Database**: Uses SQLite for fast and reliable data storage.
-   **Privacy Focused**: Passwords are hidden by default with toggle visibility.
-   **Responsive Design**: Works perfectly on desktop and mobile.
-   **Docker Ready**: Easy deployment with Docker and Docker Compose.

## 🛠️ Tech Stack

-   **Frontend**: SvelteKit, CSS (Modern & Responsive)
-   **Backend**: SvelteKit Server Actions (Node.js)
-   **Database**: SQLite (`better-sqlite3`)
-   **Authentication**: Custom session-based auth with `bcryptjs`
-   **Containerization**: Docker

## 🚀 Getting Started (Local Development)

### Prerequisites

-   Node.js (v18 or higher)
-   npm (or pnpm/yarn)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/random-password-generator.git
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

2.  **Configure Environment** (Optional)
    Open `docker-compose.yml` and update the `ORIGIN` environment variable if you are deploying to a specific domain.
    ```yaml
    environment:
      - ORIGIN=https://your-domain.com
    ```

3.  **Run the container**
    ```bash
    docker-compose up -d --build
    ```

The application will be available at `http://localhost:3000` (or your server's IP).

### Using Nginx Proxy Manager

If you are using Nginx Proxy Manager (NPM) to expose the app:

1.  Run the container as shown above.
2.  In NPM, create a new **Proxy Host**.
3.  Set **Forward Hostname / IP** to your Docker host IP.
4.  Set **Forward Port** to `3000`.
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
