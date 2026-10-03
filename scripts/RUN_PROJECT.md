Run the project (XAMPP + frontend)

Overview
- This helper shows how to start XAMPP (Apache & MySQL), import the DB schema, and run the frontend dev server (Vite).

Prerequisites
- XAMPP installed (default at `C:\xampp` or pass your XAMPP path to the BAT wrapper)
- Node.js + npm installed (for frontend)

Quick automated steps (recommended)
1. Open an elevated Command Prompt (Run as Administrator).
2. Change directory to the `scripts` folder:

```powershell
cd "c:\Users\Immanuel\OneDrive\Desktop\gha-asset-manager\scripts"
```

3. Run the helper (optionally pass your XAMPP path):

```powershell
run_project.bat "C:\xampp"
```

What the helper does
- Opens the XAMPP Control Panel so you can start Apache and MySQL.
- Imports `backend/database/schema.sql` into MySQL using `%XAMPP_PATH%\mysql\bin\mysql.exe` (as `root` with no password). If your MySQL root has a password, import manually using the `mysql` CLI and appropriate `-p` flag.
- Reminds you to verify `backend/config/config.php` for DB credentials.
- Launches the frontend: runs `npm install` then `npm run dev` in a new Command Prompt window.

Manual steps (if you prefer not to run the helper)
1. Start XAMPP Control Panel and start `Apache` and `MySQL`.
2. Import DB schema manually (example):

```powershell
"C:\xampp\mysql\bin\mysql.exe" -u root -p < "c:\Users\Immanuel\OneDrive\Desktop\gha-asset-manager\backend\database\schema.sql"
```

3. Update `backend/config/config.php` with DB credentials (host, user, password, dbname).
4. In `frontend`, install and run the dev server:

```bash
cd frontend
npm install
npm run dev
```

Verification
- Backend (PHP) served by XAMPP: `http://localhost` or the project path configured in Apache's `httpd.conf` / `httpd-vhosts.conf`.
- Frontend: Vite will print an URL (e.g., `http://localhost:5173`) — open that to use the UI.

If you want, I can:
- Edit `backend/config/config.php` to match local DB credentials (provide the values), or
- Create a `docker-compose` setup to run the stack in containers for easier reproducible runs.