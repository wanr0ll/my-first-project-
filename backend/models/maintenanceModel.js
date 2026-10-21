const { query } = require('../config/db');
const { generateId } = require('../utils/auth');

class MaintenanceModel {
    /**
     * Create a maintenance task
     */
    async createTask(data) {
        const id = data.id || generateId('MT');

        let assignedTo = data.assigned_to || null;
        let createdBy = data.created_by || null;

        if (assignedTo) {
            try {
                const u = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [assignedTo]);
                if (u.rows.length === 0) assignedTo = null;
            } catch {
                assignedTo = null;
            }
        }

        if (createdBy) {
            try {
                const u = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [createdBy]);
                if (u.rows.length === 0) createdBy = null;
            } catch {
                createdBy = null;
            }
        }

        const sql = `
            INSERT INTO maintenance_tasks 
            (id, asset_id, asset_type, description, task_type, priority, status, 
             assigned_to, scheduled_date, estimated_cost, notes, created_by, parts_maintained) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id;
        `;

        const values = [
            id,
            data.asset_id,
            data.asset_type,
            data.description || null,
            data.task_type || null,
            data.priority || 'Medium',
            data.status || 'Scheduled',
            assignedTo,
            data.scheduled_date,
            data.estimated_cost ? parseFloat(data.estimated_cost) : null,
            data.notes || null,
            createdBy,
            data.parts_maintained || null
        ];

        try {
            const res = await query(sql, values);
            return { success: true, id: res.rows[0].id };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Get all tasks with pagination and filtering
     */
    async getAllTasks(page = 1, perPage = 10, filters = {}) {
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const limit = Math.max(1, parseInt(perPage, 10) || 10);
        const offset = (currentPage - 1) * limit;

        const conditions = ['1=1'];
        const values = [];
        let idx = 1;

        if (filters.status) {
            conditions.push(`status = $${idx++}`);
            values.push(filters.status);
        }

        if (filters.priority) {
            conditions.push(`priority = $${idx++}`);
            values.push(filters.priority);
        }

        if (filters.asset_id) {
            conditions.push(`asset_id = $${idx++}`);
            values.push(filters.asset_id);
        }

        const whereClause = conditions.join(' AND ');

        // Count total
        const countSql = `SELECT COUNT(*)::int as total FROM maintenance_tasks WHERE ${whereClause};`;
        const countRes = await query(countSql, values);
        const total = countRes.rows[0]?.total || 0;

        // Select records
        const selectSql = `
            SELECT * FROM maintenance_tasks 
            WHERE ${whereClause} 
            ORDER BY scheduled_date ASC 
            LIMIT $${idx++} OFFSET $${idx++};
        `;
        values.push(limit, offset);

        const dataRes = await query(selectSql, values);

        return {
            total,
            data: dataRes.rows
        };
    }

    /**
     * Get task by ID
     */
    async getTaskById(id) {
        if (!id) return null;
        const res = await query('SELECT * FROM maintenance_tasks WHERE id = $1 LIMIT 1;', [id]);
        return res.rows[0] || null;
    }

    /**
     * Update task
     */
    async updateTask(id, data) {
        const allowedFields = [
            'description', 'task_type', 'priority', 'status', 'assigned_to',
            'scheduled_date', 'completed_date', 'estimated_cost', 'actual_cost',
            'notes', 'parts_maintained', 'receipt_url'
        ];

        const updates = [];
        const values = [];
        let idx = 1;

        for (const [key, val] of Object.entries(data)) {
            if (allowedFields.includes(key)) {
                let finalVal = val === '' ? null : val;
                if ((key === 'estimated_cost' || key === 'actual_cost') && finalVal !== null) {
                    finalVal = parseFloat(finalVal) || 0;
                }
                updates.push(`${key} = $${idx++}`);
                values.push(finalVal);
            }
        }

        if (updates.length === 0) {
            return { success: false, message: 'No valid fields provided for update' };
        }

        values.push(id);
        const sql = `UPDATE maintenance_tasks SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx};`;

        try {
            const res = await query(sql, values);
            return { success: res.rowCount > 0 };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Delete task
     */
    async deleteTask(id) {
        try {
            const res = await query('DELETE FROM maintenance_tasks WHERE id = $1;', [id]);
            return { success: res.rowCount > 0 };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
}

module.exports = new MaintenanceModel();
