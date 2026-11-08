import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast';
import * as API from '../services/api';
import { useAuth } from './AuthContext';

const MaintenanceContext = createContext();

export const useMaintenanceTasks = () => useContext(MaintenanceContext);

export const MaintenanceProvider = ({ children }) => {
    const { user } = useAuth();
    const [maintenanceTasks, setMaintenanceTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Define loadTasks for CRUD operations and sync
    const loadTasks = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setMaintenanceTasks([]);
            return;
        }

        try {
            setLoading(true);
            const response = await API.getMaintenanceTasks(1, 1000);
            setMaintenanceTasks(response.data || []);
        } catch (error) {
            console.error('Failed to load maintenance tasks:', error);
            addToast?.('Failed to load maintenance tasks', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    // Load initial data from API when authenticated
    useEffect(() => {
        if (user) {
            loadTasks();
        } else {
            setMaintenanceTasks([]);
        }
    }, [user, loadTasks]);

    // CRUD Operations
    const addMaintenanceTask = async (newTask) => {
        try {
            const response = await API.createMaintenanceTask(newTask);
            if (response.success) {
                addToast('Maintenance task created successfully', 'success');
                window.dispatchEvent(new Event('refresh_notifications'));
                await loadTasks(); // Reload tasks
                return { success: true, id: response.data?.id };
            } else {
                addToast(response.message || 'Failed to create task', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error creating task:', error);
            addToast(error.message || 'Failed to create task', 'error');
            return { success: false };
        }
    };

    const updateMaintenanceTask = async (taskId, updatedTask) => {
        try {
            const response = await API.updateMaintenanceTask(taskId, updatedTask);
            if (response.success) {
                addToast('Maintenance task updated successfully', 'success');
                window.dispatchEvent(new Event('refresh_notifications'));
                await loadTasks(); // Reload tasks
                return { success: true };
            } else {
                addToast(response.message || 'Failed to update task', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error updating task:', error);
            addToast(error.message || 'Failed to update task', 'error');
            return { success: false };
        }
    };

    const deleteMaintenanceTask = async (taskId) => {
        try {
            const response = await API.deleteMaintenanceTask(taskId);
            if (response.success) {
                addToast('Maintenance task deleted successfully', 'success');
                await loadTasks(); // Reload tasks
                return { success: true };
            } else {
                addToast(response.message || 'Failed to delete task', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            addToast(error.message || 'Failed to delete task', 'error');
            return { success: false };
        }
    };

    // Helper to get active maintenance tasks (not completed)
    const getActiveTasks = () => {
        return maintenanceTasks.filter(task =>
            task.status !== 'Completed'
        );
    };

    // Helper to get tasks by status
    const getTasksByStatus = (status) => {
        return maintenanceTasks.filter(task => task.status === status);
    };

    const value = {
        maintenanceTasks,
        loading,
        addMaintenanceTask,
        updateMaintenanceTask,
        deleteMaintenanceTask,
        getActiveTasks,
        getTasksByStatus,
        loadTasks,
    };

    return (
        <MaintenanceContext.Provider value={value}>
            {children}
        </MaintenanceContext.Provider>
    );
};

export default MaintenanceProvider;
