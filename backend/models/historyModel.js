const { query } = require('../config/db');

class HistoryModel {
    /**
     * Get recent activity logs
     */
    async getAll(limit = 20) {
        const sql = `
            SELECT h.*, u.name as performed_by_name 
            FROM asset_history h
            LEFT JOIN users u ON h.performed_by = u.id
            ORDER BY h.performed_at DESC 
            LIMIT $1;
        `;
        const res = await query(sql, [parseInt(limit, 10) || 20]);
        return res.rows;
    }

    /**
     * Log a new activity in audit trail
     */
    async log(assetId, assetType, action, description, performedBy = null, oldValues = null, newValues = null) {
        let validPerformedBy = performedBy;

        if (performedBy) {
            try {
                const u = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [performedBy]);
                if (u.rows.length === 0) validPerformedBy = null;
            } catch {
                validPerformedBy = null;
            }
        }

        const sql = `
            INSERT INTO asset_history 
            (asset_id, asset_type, action, description, performed_by, old_values, new_values) 
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;

        const values = [
            assetId,
            assetType || 'Asset',
            action,
            description,
            validPerformedBy,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null
        ];

        try {
            await query(sql, values);
            return true;
        } catch (err) {
            console.error('History logging error:', err.message);
            return false;
        }
    }

    /**
     * Get history logs for a specific asset
     */
    async getByAssetId(assetId, limit = 50) {
        const sql = `
            SELECT h.*, u.name as performed_by_name 
            FROM asset_history h
            LEFT JOIN users u ON h.performed_by = u.id
            WHERE h.asset_id = $1
            ORDER BY h.performed_at DESC 
            LIMIT $2;
        `;
        const res = await query(sql, [assetId, parseInt(limit, 10) || 50]);
        return res.rows;
    }
}

module.exports = new HistoryModel();
