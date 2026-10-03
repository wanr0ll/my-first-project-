const ftp = require("basic-ftp");
const fs = require("fs");

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

        await client.cd("htdocs/backend/config");

        console.log("Uploading production database config...");
        await client.uploadFrom("prod_database.php", "database.php");

        console.log("Successfully uploaded database config!");
    } catch (err) {
        console.error("FTP Deployment Error:", err);
    }
    client.close();
}

deploy();
