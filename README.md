# PMJ Secure - Enterprise Grade Password Generator

PMJ Secure is a modern, secure, and open-source password generator and manager built with SvelteKit and SQLite. It features military-grade encryption, a secure personal vault, and a clean, professional user interface.

![PMJ Secure Preview](/static/og-image.png)

## 📑 Table of Contents

- [Quick Install (Docker)](#-quick-install-docker) ⭐ **Start Here!**
- [Features](#-features)
- [How to Update](#-how-to-update)
- [User Guide](#-user-guide--key-workflows)
  - [Passkey Authentication](#5--passkey--biometric-authentication-webauthn)
  - [Identity Verification](#3-identity-verification-sudo-mode)
- [Docker Deployment (Full Guide)](#-docker-deployment-production)
- [Architecture](#️-architecture--technology-stack)
- [Security](#️-security-architecture)

---

## ✨ Features

-   **Strong Password Generation**: Customizable length, character sets (uppercase, lowercase, numbers, symbols).
-   **Password Strength Meter**: Visual indicator of password strength.
-   **Secure Vault**: Save passwords with titles and optional usernames.
-   **Advanced Security**: 
    -   **🔐 Passkey / Biometric Authentication**: Login with fingerprint, Face ID, or Windows Hello - no password needed!
    -   **Two-Factor Authentication (2FA)**: Secure login and password reset using TOTP (Google Authenticator, Authy, etc.).
    -   **Identity Verification**: Sensitive actions (view, edit, copy) require password re-entry.
    -   **Secure Session**: Verification remains valid for 10 minutes for convenience.
-   **Encrypted Export**: Export your password vault to a PDF file, fully encrypted with your login password.
-   **Excel Support**: Import and Export passwords via Excel files for easy migration.
-   **Dark Mode**: Elegant dark theme toggle for comfortable night usage.
-   **Search & Organize**: Easily find passwords with real-time search and filtering.
-   **User Authentication**: Secure Login and Registration system with multiple auth methods.
-   **Local Database**: Uses SQLite for fast and reliable data storage.
-   **Privacy Focused**: Passwords are hidden by default with toggle visibility.
-   **Responsive Design**: Works perfectly on desktop and mobile.
-   **Docker Ready**: Easy deployment with Docker and Docker Compose.

## 🚀 Quick Install (Docker)

**TL;DR - 3 Commands to Deploy:**

```bash
# 1. Clone repository
git clone https://github.com/emRival/PMJ-Secure.git && cd PMJ-Secure

# 2. Configure for your domain (replace with your actual domain)
cat > .env << 'EOF'
RP_ID=yourdomain.com
ORIGIN=https://secure.yourdomain.com
EOF

# 3. Run!
docker-compose up -d --build
```

**That's it!** App runs on port `3009`. 

**Next Steps:**
- Setup Nginx Proxy Manager → Point to `your-server-ip:3009`
- Enable SSL with Let's Encrypt
- Access `https://secure.yourdomain.com`
- Register account and start using!

*For detailed guide, see [Full Documentation](#-docker-deployment-production) below.*

---

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

### 4. Encrypted PDF Backups
PMJ Secure provides **true PDF encryption** using server-side generation with PDFKit.

-   **How It Works**:
    1. Click "Export PDF" and enter your login password
    2. Server generates a PDF with all your vault passwords
    3. PDF is encrypted using **128-bit RC4 encryption** with your password
    4. Encrypted PDF is downloaded to your device
-   **Security**: The exported PDF file **cannot be opened** without your exact password. Even if someone steals the file, they cannot view its contents.
-   **Permissions**: The PDF is read-only with printing and copying allowed, but modification is disabled.
-   **Excel Import/Export**: Easily migrate your data in bulk for batch password operations.

### 5. 🔐 Passkey / Biometric Authentication (WebAuthn)
PMJ Secure supports **modern passwordless authentication** using Passkeys (WebAuthn standard).

#### **What are Passkeys?**
Passkeys are cryptographic credentials stored securely on your device. They use biometric authentication (fingerprint, Face ID, Windows Hello) or device PIN for login - **no passwords needed!**

#### **Benefits:**
-   ✅ **Faster Login**: Just scan your fingerprint - no typing
-   ✅ **More Secure**: Phishing-resistant, no passwords to steal  
-   ✅ **Privacy**: Biometric data never leaves your device
-   ✅ **Multi-Device**: Register multiple passkeys (iPhone, MacBook, etc.)

#### **Setup Passkey (First Time)**
1. **Login** with your username and password
2. Go to **Account Settings**
3. Scroll to "Passkey / Biometric Login" section
4. Click **"➕ Add Passkey / Biometric"**
5. **Name your passkey** (e.g., "iPhone 13 Pro", "MacBook Air")
6. **Scan your biometric** when prompted
7. ✅ **Passkey registered!**

#### **Login with Passkey (Usernameless)**
After registration, you can login without typing anything:

1. Go to **Login Page**
2. **Click "🔑 Login with Passkey / Biometric"** (don't enter username)
3. Browser shows your saved passkeys
4. **Select your passkey**
5. **Scan biometric**
6. ✅ **Logged in instantly!**

*Optional: You can still enter username first if you have multiple accounts*

#### **Supported Devices:**
-   📱 **iPhone/iPad**: Touch ID, Face ID
-   📱 **Android**: Fingerprint, Face Unlock  
-   💻 **Mac**: Touch ID
-   💻 **Windows**: Windows Hello (fingerprint, face, PIN)
-   🔑 **Hardware Keys**: YubiKey, Titan Key, etc.

#### **Requirements:**
-   ⚠️ **HTTPS Required** (except localhost for testing)
-   ⚠️ **Valid Domain** (IP addresses not supported in production)

#### **Managing Passkeys:**
-   **View all registered passkeys** in Account Settings
-   **Delete passkeys** you no longer use
-   **Register multiple passkeys** for different devices
-   Each passkey shows **creation date** and **last used** timestamp

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
-   **`@simplewebauthn/server` & `@simplewebauthn/browser`**: WebAuthn implementation for Passkey/biometric authentication.
-   **`otplib` & `qrcode`**: Standards-compliant libraries for generating and verifying TOTP codes for 2FA.
-   **Session Management**: Custom implementation using secure, `HttpOnly`, `SameSite=Strict` cookies to prevent XSS and CSRF attacks.
-   **Rate Limiting**: Custom middleware to prevent brute-force attacks on registration and login endpoints.

### PDF Generation
-   **`pdfkit`**: Server-side PDF generation with native encryption support (128-bit RC4).
-   **Security First**: PDFs are generated and encrypted on the server to ensure proper password protection that cannot be bypassed.

## 🛡️ Security Architecture

We take security seriously. Here is how we protect your data:

1.  **🔐 Passkey / Biometric Authentication (WebAuthn)**: Modern, phishing-resistant authentication using device biometrics. Credentials are discoverable (resident keys) allowing usernameless login.
2.  **Two-Factor Authentication (2FA)**: Adds a critical second layer of defense. Even if your password is stolen, an attacker cannot access your account without your physical device. We also support **Emergency Password Reset** via 2FA.
3.  **Sudo Mode**: Sensitive actions (viewing, editing, or copying passwords) require you to re-enter your master password. This session stays active for 10 minutes, balancing security with convenience.
4.  **Military-Grade PDF Encryption**: When you export your vault to PDF, the document is generated server-side and encrypted with **128-bit RC4 encryption** using your master password. The PDF cannot be opened without the exact password, even if the file is intercepted or stolen.
5.  **Local-First Design**: Your data lives on your server (or local machine), not in a third-party cloud. You own your data completely.

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

## 🐳 Docker Deployment (Production)

This project is optimized for production deployment using Docker and Docker Compose. Follow this comprehensive guide for a complete production setup.

### 📋 Prerequisites

Before you begin, ensure you have:
-   ✅ Docker Engine installed (`docker --version`)
-   ✅ Docker Compose installed (`docker-compose --version`)
-   ✅ A domain name (required for Passkey/HTTPS - e.g., `secure.yourdomain.com`)
-   ✅ Access to DNS settings for your domain
-   ✅ (Optional) Nginx Proxy Manager or reverse proxy

### 🚀 Step-by-Step Deployment Guide

#### **Step 1: Clone Repository**

```bash
# SSH into your server
ssh user@your-server-ip

# Clone the repository
git clone https://github.com/emRival/PMJ-Secure.git
cd PMJ-Secure
```

#### **Step 2: Configure Environment Variables**

Create a `.env` file for production configuration:

```bash
cat > .env << 'EOF'
# Production Configuration
NODE_ENV=production

# Passkey / WebAuthn Configuration
# IMPORTANT: Use your actual domain name, NOT IP address
RP_ID=yourdomain.com
ORIGIN=https://secure.yourdomain.com

# Database Path
DB_PATH=/app/data/passwords.db
EOF
```

**Important Notes:**
-   `RP_ID`: Your base domain (e.g., `yourdomain.com` or `secure.yourdomain.com`)
-   `ORIGIN`: Full HTTPS URL users will access (e.g., `https://secure.yourdomain.com`)
-   ⚠️ **IP addresses are NOT supported** for Passkey authentication
-   ⚠️ **HTTP is NOT recommended** for production (except localhost testing)

#### **Step 3: Configure Docker Compose**

The default `docker-compose.yml` is ready for production. Update if needed:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3009:3000"  # External:Internal port mapping
    volumes:
      - ./data:/app/data  # Persistent database storage
    environment:
      - NODE_ENV=production
      - RP_ID=${RP_ID}
      - ORIGIN=${ORIGIN}
      - DB_PATH=/app/data/passwords.db
    restart: unless-stopped
    container_name: pmj-secure-app
```

**Port Configuration:**
-   Default external port: `3009`
-   To change, edit `"3009:3000"` → `"YOUR_PORT:3000"`

#### **Step 4: Build and Run Container**

```bash
# Build and start container in detached mode
docker-compose up -d --build

# Verify container is running
docker-compose ps

# Check logs to ensure successful startup
docker-compose logs -f
```

Expected log output:
```
pmj-secure-app | Listening on http://0.0.0.0:3000
pmj-secure-app | Database initialized
```

Press `Ctrl+C` to exit logs.

### 🌐 Step 5: Configure Nginx Proxy Manager (Recommended)

For HTTPS and domain access, use Nginx Proxy Manager:

#### **5.1. Add Proxy Host**

1. Open Nginx Proxy Manager dashboard
2. Go to **Hosts** → **Proxy Hosts** → **Add Proxy Host**
3. Configure:

   **Details Tab:**
   - **Domain Names**: `secure.yourdomain.com`
   - **Scheme**: `http` (internal connection)
   - **Forward Hostname/IP**: Your Docker host IP (e.g., `172.16.66.22`)
   - **Forward Port**: `3009` (or your configured port)
   - ✅ Enable **Websockets Support**
   - ✅ Enable **Block Common Exploits**

   **SSL Tab:**
   - ✅ Request **Let's Encrypt Certificate**
   - ✅ Enable **Force SSL**
   - ✅ Enable **HTTP/2 Support**
   - ✅ Enable **HSTS Enabled**

4. Click **Save**

#### **5.2. Verify HTTPS**

-   Wait ~60 seconds for SSL certificate
-   Visit `https://secure.yourdomain.com`
-   Check browser shows secure padlock 🔒

#### **5.3. Update Environment for Production Domain**

```bash
# Update .env with your actual domain
cat > .env << 'EOF'
NODE_ENV=production
RP_ID=yourdomain.com
ORIGIN=https://secure.yourdomain.com
DB_PATH=/app/data/passwords.db
EOF

# Restart container to apply changes
docker-compose restart
```

### 🔄 Updating Your Deployment

When updates are available:

```bash
cd ~/PMJ-Secure

# Pull latest code
git pull origin main

# Handle local changes if any
git stash  # Save local modifications
git pull origin main
git stash pop  # Restore local modifications

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify update
docker-compose logs -f --tail=100
```

### 🔧 Troubleshooting

#### **Container won't start**
```bash
# Check detailed logs
docker-compose logs --tail=100

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### **Database issues**
```bash
# Backup database first
cp data/passwords.db data/passwords.db.backup

# Check database integrity
sqlite3 data/passwords.db "PRAGMA integrity_check;"
```

#### **Passkey not working**
-   ✅ Verify `RP_ID` matches your domain in `.env`
-   ✅ Ensure accessing via HTTPS (check browser address bar)
-   ✅ Clear browser cache and re-register passkey
-   ✅ Check console for detailed error messages (F12)

### 📊 Container Management

```bash
# View running containers
docker-compose ps

# Stop container
docker-compose stop

# Start container
docker-compose start

# Restart container
docker-compose restart

# View real-time logs
docker-compose logs -f

# View last 50 log lines
docker-compose logs --tail=50

# Remove container (keeps data)
docker-compose down

# Remove container and volumes (⚠️ DELETES DATABASE)
docker-compose down -v
```

### 💾 Backup & Restore

#### **Backup Database**
```bash
# Create backup
docker-compose exec app cp /app/data/passwords.db /app/data/passwords.db.backup
cp data/passwords.db ~/backups/passwords-$(date +%Y%m%d).db

# Or backup entire data directory
tar -czf pmj-secure-backup-$(date +%Y%m%d).tar.gz data/
```

#### **Restore Database**
```bash
# Stop container
docker-compose down

# Restore backup
cp ~/backups/passwords-20231220.db data/passwords.db

# Start container
docker-compose up -d
```

### 🔐 Production Security Checklist

Before going live:
-   ✅ HTTPS enabled with valid SSL certificate
-   ✅ Strong firewall rules (allow only 80, 443, and SSH)
-   ✅ Regular automated backups configured
-   ✅ `.env` file has correct `RP_ID` and `ORIGIN`
-   ✅ Docker container set to `restart: unless-stopped`
-   ✅ System updates configured (unattended-upgrades)
-   ✅ Monitoring/alerting configured (optional but recommended)

### 📈 Performance Optimization

For high-traffic deployments:

```yaml
# Add to docker-compose.yml
services:
  app:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
```

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
