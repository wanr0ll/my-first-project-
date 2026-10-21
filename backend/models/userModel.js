const crypto = require('crypto');
const { query } = require('../config/db');
const { generateId, hashPassword, verifyPassword } = require('../utils/auth');

class UserModel {
    /**
     * Create a new user
     */
    async create(data) {
        const id = data.id || generateId('USR');
        const hashedPassword = hashPassword(data.password);
        const emailVerified = Boolean(data.email_verified);
        const status = data.status || 'pending';

        const sql = `
            INSERT INTO users 
            (id, name, email, password, phone, role, position, division, status, email_verified) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        `;

        const values = [
            id,
            data.name,
            data.email.toLowerCase().trim(),
            hashedPassword,
            data.phone || null,
            data.role,
            data.position || null,
            data.division || null,
            status,
            emailVerified
        ];

        try {
            const res = await query(sql, values);
            return { success: true, id: res.rows[0].id };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Get user by email (supports shorthand @gha.gov.gh)
     */
    async getByEmail(email) {
        if (!email) return null;
        const cleanEmail = email.toLowerCase().trim();
        const fallback = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@gha.gov.gh`;

        const sql = `
            SELECT * FROM users 
            WHERE LOWER(email) = $1 OR LOWER(email) = $2 
            LIMIT 1;
        `;
        const res = await query(sql, [cleanEmail, fallback]);
        return res.rows[0] || null;
    }

    /**
     * Get user by phone number
     */
    async getByPhone(phone) {
        if (!phone) return null;
        const sql = 'SELECT * FROM users WHERE phone = $1 LIMIT 1;';
        const res = await query(sql, [phone.trim()]);
        return res.rows[0] || null;
    }

    /**
     * Get user by ID (includes online status indicator)
     */
    async getById(id) {
        if (!id) return null;
        const sql = `
            SELECT id, name, email, phone, role, position, division, status, profile_image, 
                   permissions, created_at, updated_at, last_active,
                   CASE WHEN last_active > (NOW() - INTERVAL '2 minute') THEN 1 ELSE 0 END as is_online 
            FROM users 
            WHERE id = $1 LIMIT 1;
        `;
        const res = await query(sql, [id]);
        return res.rows[0] || null;
    }

    /**
     * Get all users with pagination and filtering
     */
    async getAll(page = 1, perPage = 10, filters = {}) {
        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(perPage, 10);
        const limit = parseInt(perPage, 10);

        const conditions = ['1=1'];
        const values = [];
        let idx = 1;

        if (filters.role) {
            conditions.push(`role = $${idx++}`);
            values.push(filters.role);
        }

        if (filters.division) {
            conditions.push(`division = $${idx++}`);
            values.push(filters.division);
        }

        if (filters.search) {
            conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
            values.push(`%${filters.search}%`);
            idx++;
        }

        const whereClause = conditions.join(' AND ');

        // Count total
        const countSql = `SELECT COUNT(*)::int as total FROM users WHERE ${whereClause};`;
        const countRes = await query(countSql, values);
        const total = countRes.rows[0]?.total || 0;

        // Select page
        const selectSql = `
            SELECT id, name, email, phone, role, position, division, status, email_verified, 
                   permissions, created_at, last_active,
                   CASE WHEN last_active > (NOW() - INTERVAL '2 minute') THEN 1 ELSE 0 END as is_online
            FROM users 
            WHERE ${whereClause}
            ORDER BY created_at DESC 
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
     * Update user details
     */
    async update(id, data) {
        const allowedFields = ['name', 'phone', 'role', 'position', 'division', 'status', 'profile_image', 'permissions'];
        const updates = [];
        const values = [];
        let idx = 1;

        for (const [key, val] of Object.entries(data)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = $${idx++}`);
                values.push(val);
            } else if (key === 'password' && val) {
                updates.push(`password = $${idx++}`);
                values.push(hashPassword(val));
            }
        }

        if (updates.length === 0) {
            return { success: false, message: 'No valid fields provided for update' };
        }

        values.push(id);
        const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx};`;

        try {
            await query(sql, values);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Delete user and reassign/clean related records
     */
    async delete(id) {
        try {
            await query('DELETE FROM notifications WHERE user_id = $1;', [id]);
            await query('UPDATE maintenance_tasks SET created_by = NULL WHERE created_by = $1;', [id]);
            await query('UPDATE maintenance_tasks SET assigned_to = NULL WHERE assigned_to = $1;', [id]);
            await query('UPDATE asset_history SET performed_by = NULL WHERE performed_by = $1;', [id]);
            await query('UPDATE assets SET created_by = NULL WHERE created_by = $1;', [id]);
            await query('UPDATE assets SET custodian_id = NULL, custodian_name = NULL WHERE custodian_id = $1;', [id]);

            const res = await query('DELETE FROM users WHERE id = $1;', [id]);
            return { success: res.rowCount > 0 };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Update user last active timestamp
     */
    async updateLastActive(id) {
        try {
            await query('UPDATE users SET last_active = NOW() WHERE id = $1;', [id]);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Update password directly by user ID
     */
    async updatePassword(id, newPassword) {
        try {
            const hashed = hashPassword(newPassword);
            await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2;', [hashed, id]);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Verify credentials against email
     */
    async verifyPassword(email, password) {
        const user = await this.getByEmail(email);
        if (!user || !user.password) return false;
        return verifyPassword(password, user.password);
    }

    /**
     * Set password reset token (valid 1 hour)
     */
    async setResetToken(email, token) {
        try {
            const sql = `
                UPDATE users 
                SET reset_token = $1, reset_token_expiry = NOW() + INTERVAL '1 hour' 
                WHERE LOWER(email) = LOWER($2);
            `;
            await query(sql, [token, email]);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Verify password reset token
     */
    async verifyResetToken(token) {
        const sql = `
            SELECT id, email FROM users 
            WHERE reset_token = $1 AND reset_token_expiry > NOW() 
            LIMIT 1;
        `;
        const res = await query(sql, [token]);
        return res.rows[0] || null;
    }

    /**
     * Update password with reset token
     */
    async updatePasswordWithToken(token, newPassword) {
        const user = await this.verifyResetToken(token);
        if (!user) {
            return { success: false, message: 'Invalid or expired OTP token' };
        }

        const hashed = hashPassword(newPassword);
        const sql = `
            UPDATE users 
            SET password = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() 
            WHERE id = $2;
        `;
        try {
            await query(sql, [hashed, user.id]);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Set email verification OTP (valid 24 hours)
     */
    async setVerificationToken(email, token) {
        try {
            const sql = `
                UPDATE users 
                SET verification_token = $1, verification_token_expiry = NOW() + INTERVAL '24 hours' 
                WHERE LOWER(email) = LOWER($2);
            `;
            await query(sql, [token, email]);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Verify verification OTP and issue short-lived set_password_token
     */
    async verifyVerificationToken(token) {
        const sql = `
            SELECT id, email FROM users 
            WHERE verification_token = $1 AND verification_token_expiry > NOW() 
            LIMIT 1;
        `;
        const res = await query(sql, [token]);
        const user = res.rows[0];

        if (!user) {
            return { success: false, message: 'Invalid or expired verification code' };
        }

        const setPasswordToken = crypto.randomBytes(32).toString('hex');
        const updateSql = `
            UPDATE users 
            SET email_verified = TRUE, verification_token = NULL, verification_token_expiry = NULL, 
                reset_token = $1, reset_token_expiry = NOW() + INTERVAL '30 minutes' 
            WHERE id = $2;
        `;
        try {
            await query(updateSql, [setPasswordToken, user.id]);
            return { success: true, set_password_token: setPasswordToken, email: user.email };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Set initial password and activate account
     */
    async setInitialPassword(token, newPassword) {
        const sql = `
            SELECT id, email FROM users 
            WHERE reset_token = $1 AND reset_token_expiry > NOW() 
            LIMIT 1;
        `;
        const res = await query(sql, [token]);
        const user = res.rows[0];

        if (!user) {
            return { success: false, message: 'Invalid or expired setup token. Please request a new verification code.' };
        }

        const hashed = hashPassword(newPassword);
        const updateSql = `
            UPDATE users 
            SET password = $1, status = 'active', reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() 
            WHERE id = $2;
        `;
        try {
            await query(updateSql, [hashed, user.id]);
            return { success: true, email: user.email };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
}

module.exports = new UserModel();
