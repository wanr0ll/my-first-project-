const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");

async function deploy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftpupload.net",
            user: "if0_42442090",
            password: "wanroll123K224",
            secure: false
        });

        console.log("Connected to InfinityFree FTP successfully.");

        await client.cd("htdocs");

        console.log("Uploading frontend dist directory to htdocs...");
        await client.uploadFromDir("frontend/dist", ".");

        // Also upload the .htaccess for correct React Router functionality!
        fs.writeFileSync("temp_htaccess.txt", `<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteBase /\n  RewriteRule ^index\\.html$ - [L]\n  RewriteCond %{REQUEST_FILENAME} !-f\n  RewriteCond %{REQUEST_FILENAME} !-d\n  RewriteRule . /index.html [L]\n</IfModule>`);
        await client.uploadFrom("temp_htaccess.txt", ".htaccess");
        fs.unlinkSync("temp_htaccess.txt");

        // Backend upload logic (skip config/database.php to avoid breaking their live credentials).
        if (fs.existsSync("backend_staging")) {
            fs.rmSync("backend_staging", { recursive: true, force: true });
        }
        fs.cpSync("backend", "backend_staging", { recursive: true });
        if (fs.existsSync(path.join("backend_staging", "config", "database.php"))) {
            fs.rmSync(path.join("backend_staging", "config", "database.php"));
            console.log("Excluded database.php from the upload so live credentials aren't overwritten.");
        }

        console.log("Uploading backend directory to htdocs/backend...");
        await client.ensureDir("backend");
        await client.uploadFromDir("backend_staging", ".");

        fs.rmSync("backend_staging", { recursive: true, force: true });

        // Sometimes InfinityFree likes a dummy index.php as a fallback if index.html isn't taking priority.
        fs.writeFileSync("temp_index.php", `<?php include_once("index.html"); ?>`);
        await client.cd("/");
        await client.cd("htdocs");
        await client.uploadFrom("temp_index.php", "index.php");
        fs.unlinkSync("temp_index.php");

        console.log("Successfully deployed to InfinityFree! Site should be live.");
    } catch (err) {
        console.error("FTP Deployment Error:", err);
    }
    client.close();
}

deploy();
