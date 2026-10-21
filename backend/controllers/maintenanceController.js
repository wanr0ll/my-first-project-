const maintenanceModel = require('../models/maintenanceModel');
const historyModel = require('../models/historyModel');
const { success, error, paginated } = require('../utils/response');

class MaintenanceController {
    /**
     * Get all tasks with pagination
     */
    async getTasks(req, res) {
        const page = parseInt(req.query.page, 10) || 1;
        const perPage = parseInt(req.query.per_page, 10) || 10;

        const filters = {
            status: req.query.status || null,
            priority: req.query.priority || null,
            asset_id: req.query.asset_id || null
        };

        const result = await maintenanceModel.getAllTasks(page, perPage, filters);
        return paginated(res, result.data, result.total, page, perPage, 'Tasks retrieved successfully');
    }

    /**
     * Get task by ID
     */
    async getTaskById(req, res) {
        const id = req.params.id || req.query.id;
        if (!id) {
            return error(res, 'Task ID is required', 400);
        }

        const task = await maintenanceModel.getTaskById(id);
        if (!task) {
            return error(res, 'Task not found', 404);
        }

        return success(res, task, 'Task retrieved successfully');
    }

    /**
     * Create maintenance task
     */
    async createTask(req, res) {
        const user = req.user;
        const data = req.body || {};

        if (!data.asset_id || !data.asset_type || !data.scheduled_date) {
            return error(res, 'asset_id, asset_type, and scheduled_date are required', 400);
        }

        data.created_by = user.id;

        const result = await maintenanceModel.createTask(data);
        if (!result.success) {
            return error(res, result.message || 'Task creation failed', 400);
        }

        historyModel.log(
            data.asset_id,
            data.asset_type,
            'Maintenance Created',
            `New maintenance task '${data.description || 'Task'}' was created for asset ${data.asset_id}`,
            user.id
        ).catch(() => {});

        return success(res, { id: result.id }, 'Task created successfully', 201);
    }

    /**
     * Update maintenance task
     */
    async updateTask(req, res) {
        const user = req.user;
        const data = req.body || {};
        const id = req.params.id || data.id || req.query.id;

        if (!id) {
            return error(res, 'Task ID is required', 400);
        }

        const existing = await maintenanceModel.getTaskById(id);
        if (!existing) {
            return error(res, 'Task not found', 404);
        }

        const result = await maintenanceModel.updateTask(id, data);
        if (!result.success) {
            return error(res, result.message || 'Task update failed', 500);
        }

        if (data.status === 'Completed') {
            let desc = 'Maintenance completed.';
            const parts = data.parts_maintained || existing.parts_maintained;
            const cost = data.actual_cost || existing.actual_cost;
            if (parts) desc += ` Parts Maintained: ${parts}.`;
            if (cost) desc += ` Cost: GHS ${parseFloat(cost).toFixed(2)}.`;

            historyModel.log(
                existing.asset_id,
                existing.asset_type,
                'Asset Maintained',
                desc,
                user.id,
                existing,
                { ...existing, ...data }
            ).catch(() => {});
        } else {
            const statusMsg = data.status || existing.status;
            historyModel.log(
                id,
                'Task',
                'Maintenance Updated',
                `Maintenance task status updated to '${statusMsg}'`,
                user.id
            ).catch(() => {});
        }

        return success(res, null, 'Task updated successfully');
    }

    /**
     * Delete maintenance task
     */
    async deleteTask(req, res) {
        const id = req.params.id || req.query.id;
        if (!id) {
            return error(res, 'Task ID is required', 400);
        }

        const existing = await maintenanceModel.getTaskById(id);
        if (!existing) {
            return error(res, 'Task not found', 404);
        }

        const result = await maintenanceModel.deleteTask(id);
        if (!result.success) {
            return error(res, result.message || 'Task deletion failed', 500);
        }

        return success(res, null, 'Task deleted successfully');
    }

    /**
     * Upload maintenance receipt
     */
    async uploadReceipt(req, res) {
        const user = req.user;
        const taskId = req.body.task_id || req.query.task_id;

        if (!taskId) {
            return error(res, 'task_id is required', 400);
        }

        if (!req.file) {
            return error(res, 'No valid file uploaded', 400);
        }

        const receiptUrl = `/uploads/receipts/${req.file.filename}`;

        const updateResult = await maintenanceModel.updateTask(taskId, { receipt_url: receiptUrl });
        if (!updateResult.success) {
            return error(res, 'Failed to update task with receipt URL', 500);
        }

        const task = await maintenanceModel.getTaskById(taskId);
        if (task) {
            historyModel.log(
                task.asset_id,
                task.asset_type,
                'Maintenance Receipt Uploaded',
                `A receipt was uploaded for maintenance task ${taskId}`,
                user.id
            ).catch(() => {});
        }

        return success(res, { receipt_url: receiptUrl }, 'Receipt uploaded successfully');
    }
}

module.exports = new MaintenanceController();
