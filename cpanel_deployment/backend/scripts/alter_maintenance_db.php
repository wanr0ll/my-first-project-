<?php

/**
 * Script to alter maintenance_tasks table
 * Add parts_maintained column
 */

require_once __DIR__ . '/../config/config.php';

echo "Updating maintenance_tasks schema...\n";

$sql = "ALTER TABLE maintenance_tasks ADD COLUMN parts_maintained TEXT NULL AFTER actual_cost";

if (DB->query($sql) === TRUE) {
    echo "Success: parts_maintained column added to maintenance_tasks.\n";
} else {
    echo "Error updating schema: " . DB->error . "\n";
}
