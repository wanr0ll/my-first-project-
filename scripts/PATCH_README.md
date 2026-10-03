This script backs up and patches common XAMPP Apache/PHP config settings to reduce version disclosure.

Files:
- `patch_xampp_configs.ps1` — PowerShell script that creates a timestamped backup and patches:
  - `ServerSignature Off` in `httpd.conf`
  - `ServerTokens Prod` in `httpd.conf`
  - `expose_php = Off` in `php.ini`
- `run_patch.bat` — Windows wrapper. Run as Administrator.

Default XAMPP paths assumed:
- Apache: `C:\xampp\apache\conf\httpd.conf`
- PHP: `C:\xampp\php\php.ini`

How to run:
1. Open an elevated Command Prompt (Run as Administrator).
2. Change to the repository `scripts` folder:

```powershell
cd "c:\Users\Immanuel\OneDrive\Desktop\gha-asset-manager\scripts"
```

3. Run the wrapper (optionally pass your XAMPP path):

```powershell
run_patch.bat "C:\xampp"
```

4. After the script reports success, restart Apache using the XAMPP Control Panel.

Notes & safety:
- The script copies original files into a `backup_configs_YYYYMMDD_HHMMSS` directory under your XAMPP root before modifying anything.
- Review the backup files before restarting if you want to revert; backups are plain copies.
- If your XAMPP installation is in a different location, pass that path as the first argument to the BAT file.
- If you prefer me to generate a reversible patch instead of in-place edits, tell me and I will update the scripts.