/**
 * API Service - Handles all API calls to the PHP backend
 */

const PROD_BACKEND_FALLBACK = 'https://my-first-project-production-e47d.up.railway.app/api/index.php';

// In production, use VITE_API_URL (Railway/Render). In dev, use Vite proxy.
const CONFIGURED_BASE = import.meta.env.VITE_API_URL
    || (import.meta.env.DEV ? '/api/index.php' : PROD_BACKEND_FALLBACK);

// Only try localhost fallbacks in development (avoids mixed-content errors on mobile in prod)
const BASE_URL_CANDIDATES = import.meta.env.DEV
    ? [
        CONFIGURED_BASE,
        '/api/index.php',
        'http://localhost/gha-asset-manager/backend/api/index.php',
        'http://localhost/backend/api/index.php',
        'http://127.0.0.1/gha-asset-manager/backend/api/index.php',
        'http://127.0.0.1/backend/api/index.php',
    ].filter(Boolean)
    : [CONFIGURED_BASE, PROD_BACKEND_FALLBACK].filter(Boolean);

let resolvedBaseUrl = null;

export function getBaseUrlSync() {
    let base = resolvedBaseUrl || import.meta.env.VITE_API_URL || CONFIGURED_BASE;
    if (!base || base.startsWith('/api')) {
        if (import.meta.env.DEV) {
            base = 'http://localhost/gha-asset-manager/backend';
        } else {
            base = PROD_BACKEND_FALLBACK;
        }
    }
    // Remove /api/index.php or /api if it's there to get the root directory for uploads
    base = base.replace(/\/api\/index\.php$/, '').replace(/\/api$/, '');
    // Ensure it doesn't end with a slash
    return base.replace(/\/$/, '');
}

/**
 * Returns a fully-qualified image URL for user profile photos, receipts, or uploaded assets.
 */
export function getFullImageUrl(path) {
    if (!path || typeof path !== 'string') return null;
    if (path.startsWith('data:') || path.startsWith('blob:')) return path;

    // Fix legacy stored URLs missing /backend
    if (path.includes('localhost/gha-asset-manager/uploads/') && !path.includes('localhost/gha-asset-manager/backend/uploads/')) {
        return path.replace('localhost/gha-asset-manager/uploads/', 'localhost/gha-asset-manager/backend/uploads/');
    }

    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const base = getBaseUrlSync();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${cleanPath}` : cleanPath;
}

export async function resolveBaseUrl() {
    if (resolvedBaseUrl) return resolvedBaseUrl;

    // In production with a configured URL, skip probing and use it directly
    if (!import.meta.env.DEV && CONFIGURED_BASE) {
        resolvedBaseUrl = CONFIGURED_BASE.replace(/\/$/, '');
        return resolvedBaseUrl;
    }

    // In dev, probe each candidate
    for (const base of BASE_URL_CANDIDATES) {
        const healthUrl = base.includes('index.php')
            ? `${base}?request=health`
            : `${base.replace(/\/$/, '')}/health`;
        try {
            const r = await fetch(healthUrl, { method: 'GET' });
            if (r.ok) {
                const text = await r.clone().text();
                if (text.trim().startsWith('<')) {
                    throw new Error('Returned HTML instead of API JSON');
                }
                const data = await r.json();
                if (data && data.success) {
                    resolvedBaseUrl = base.replace(/\/$/, '');
                    return resolvedBaseUrl;
                }
            }
        } catch { /* health check failed, try next */ }
    }
    resolvedBaseUrl = CONFIGURED_BASE.replace(/\/$/, '');
    return resolvedBaseUrl;
}


class APIClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    /**
     * Get authentication token
     */
    getToken() {
        return this.token || localStorage.getItem('auth_token');
    }

    /**
     * Clear authentication
     */
    clearAuth() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const baseUrl = await resolveBaseUrl();
        // Parse endpoint to separate base path and query parameters
        const [basePath, queryPart] = endpoint.split('?');

        // Build URL with request parameter and any additional query params
        const url = queryPart
            ? `${baseUrl}?request=${basePath}&${queryPart}`
            : `${baseUrl}?request=${basePath}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add authorization token if available
        const token = this.getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch {
                const snippet = responseText.slice(0, 200).replace(/\n/g, ' ');
                console.error('Server did not return JSON. Status:', response.status, 'Response:', responseText);
                throw new Error(
                    'Invalid response from server. Check console (F12) for details. ' +
                    (snippet ? `Server returned: ${snippet}...` : '')
                );
            }
            if (data === null) {
                throw new Error('Empty response from server');
            }

            // Check for authentication errors
            if (response.status === 401 || (response.status === 403 && (data.message?.toLowerCase().includes('suspended') || data.message?.toLowerCase().includes('deleted') || data.message?.toLowerCase().includes('pending')))) {
                this.clearAuth();
                // Dispatch a custom event instead of hard-redirecting, so React Router
                // handles navigation without destroying the page (which caused blank screens).
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                throw new Error(data.message || 'Unauthorized');
            }

            if (!response.ok) {
                throw new Error(data.message || `API Error: ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('API Request Error: Cannot reach backend.', error);
                const isLocal = import.meta.env.DEV;
                throw new Error(
                    isLocal
                        ? 'Cannot reach the server. Please ensure XAMPP is running (start Apache) and the backend is reachable.'
                        : 'Cannot reach the server. The backend may be temporarily unavailable. Please try again shortly.'
                );
            }
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'DELETE' });
    }
}

// ============ AUTHENTICATION ENDPOINTS ============

/**
 * Login
 */
export async function login(email, password) {
    const client = new APIClient();
    const response = await client.post('auth/login', {
        email,
        password
    });

    if (response.success && response.data?.token) {
        client.setToken(response.data.token);
    }

    return response;
}

/**
 * Register
 */
export async function register(name, email, password, role = 'Worker', division = 'General', extra = {}) {
    const client = new APIClient();
    return client.post('auth/register', {
        name,
        email,
        password,
        role,
        division,
        position: extra.position || null,
        phone: extra.phone || null
    });
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const client = new APIClient();
    return client.get('auth/me');
}

export const verifyResetOtp = async (otp) => {
    const client = new APIClient();
    return client.post('auth/verify-reset-otp', { token: otp });
};

export const resetPassword = async (otp, newPassword) => {
    const client = new APIClient();
    return client.post('auth/reset-password', { token: otp, password: newPassword });
};

export const verifyEmail = async (email, otp) => {
    const client = new APIClient();
    return client.post('auth/verify-email', { email, otp });
};

export const resendVerification = async (email) => {
    const client = new APIClient();
    return client.post('auth/resend-verification', { email });
};

export const setInitialPassword = async (token, password) => {
    const client = new APIClient();
    return client.post('auth/set-initial-password', { token, password });
};

/**
 * Change password
 */
export async function changePassword(currentPassword, newPassword) {
    const client = new APIClient();
    return client.put('auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
    });
}

/**
 * Forgot password - Send reset link
 */
export async function forgotPassword(email) {
    const client = new APIClient();
    return client.post('auth/forgot-password', { email });
}


/**
 * Logout
 */
export async function logout() {
    const client = new APIClient();
    try {
        await client.post('auth/logout');
    } catch (error) {
        console.error('Logout error:', error);
    }
    const apiClient = new APIClient();
    apiClient.clearAuth();
}

// ============ USER MANAGEMENT ENDPOINTS ============

/**
 * Get all users
 */
export async function getUsers(page = 1, perPage = 10, filters = {}) {
    const client = new APIClient();
    return client.get('users', {
        page,
        per_page: perPage,
        ...filters
    });
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
    const client = new APIClient();
    return client.get('users', { id: userId });
}

/**
 * Create user
 */
export async function createUser(userData) {
    const client = new APIClient();
    return client.post('users', userData);
}

/**
 * Update user
 */
export async function updateUser(userId, userData) {
    const client = new APIClient();
    return client.put('users', {
        id: userId,
        ...userData
    });
}

/**
 * Delete user
 */
export async function deleteUser(id) {
    const client = new APIClient();
    return client.delete(`users/${id}`);
}

/**
 * Ping user to update last_active timestamp
 */
export async function pingUser() {
    const client = new APIClient();
    return client.post('users/ping');
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(file) {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('profile_image', file);

    const baseUrl = await resolveBaseUrl();
    const url = `${baseUrl}?request=users/upload_profile`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        let errorMsg = 'Failed to upload profile image';
        try {
            const error = await response.json();
            errorMsg = error.message || errorMsg;
        } catch {
            // Fallback for non-JSON or other errors
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

// ============ ASSET ENDPOINTS ============

/**
 * Get assets by category
 */
export async function getAssets(category, page = 1, perPage = 10, filters = {}) {
    const client = new APIClient();
    return client.get(`assets/${category}`, {
        page,
        per_page: perPage,
        ...filters
    });
}

/**
 * Get asset by ID
 */
export async function getAssetById(category, assetId) {
    const client = new APIClient();
    return client.get(`assets/${category}`, { id: assetId });
}

/**
 * Create asset
 */
export async function createAsset(assetData) {
    const client = new APIClient();
    return client.post('assets', assetData);
}

/**
 * Update asset
 */
export async function updateAsset(assetData) {
    const client = new APIClient();
    return client.put('assets', assetData);
}

/**
 * Upload a receipt / scanned document for an asset
 */
export async function uploadAssetReceipt(assetId, file) {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('asset_id', assetId);

    const baseUrl = await resolveBaseUrl();
    const url = `${baseUrl}?request=assets/upload_receipt`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        let errorMsg = 'Failed to upload receipt';
        try {
            const error = await response.json();
            errorMsg = error.message || errorMsg;
        } catch {
            // non-JSON fallback
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

/**
 * Transfer asset
 */
export async function transferAsset(assetData) {
    const client = new APIClient();
    return client.put('assets/transfer', assetData);
}

/**
 * Delete asset
 */
export async function deleteAsset(category, assetId) {
    const client = new APIClient();
    return client.delete(`assets/${category}`, { id: assetId });
}

// ============ MAINTENANCE ENDPOINTS ============

/**
 * Get maintenance tasks
 */
export async function getMaintenanceTasks(page = 1, perPage = 10, filters = {}) {
    const client = new APIClient();
    return client.get('maintenance', {
        page,
        per_page: perPage,
        ...filters
    });
}

/**
 * Get maintenance task by ID
 */
export async function getMaintenanceTaskById(taskId) {
    const client = new APIClient();
    return client.get('maintenance', { id: taskId });
}

/**
 * Create maintenance task
 */
export async function createMaintenanceTask(taskData) {
    const client = new APIClient();
    return client.post('maintenance', taskData);
}

/**
 * Update maintenance task
 */
export async function updateMaintenanceTask(taskId, taskData) {
    const client = new APIClient();
    return client.put('maintenance', {
        id: taskId,
        ...taskData
    });
}

/**
 * Delete maintenance task
 */
export async function deleteMaintenanceTask(taskId) {
    const client = new APIClient();
    return client.delete('maintenance', { id: taskId });
}

/**
 * Upload maintenance receipt
 */
export async function uploadMaintenanceReceipt(taskId, file) {
    const client = new APIClient();
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('receipt', file);
    return client.post('maintenance/upload_receipt', formData);
}

// ============ HISTORY / ACTIVITY ENDPOINTS ============

/**
 * Get recent activity
 */
export async function getRecentActivity(limit = 10) {
    const client = new APIClient();
    return client.get('activity', { limit });
}

/**
 * Get history for a specific asset
 */
export async function getAssetHistory(assetId, limit = 50) {
    const client = new APIClient();
    return client.get('history', { asset_id: assetId, limit });
}

/**
 * Get completed maintenance tasks for a specific asset
 */
export async function getMaintenanceByAsset(assetId) {
    const client = new APIClient();
    return client.get('maintenance', { asset_id: assetId, per_page: 100, page: 1 });
}

// ============ UTILITY ============

/**
 * Health check
 */
export async function healthCheck() {
    const client = new APIClient();
    return client.get('health');
}

// ============ NOTIFICATION ENDPOINTS ============

export async function getNotifications(page = 1, limit = 50) {
    const client = new APIClient();
    return client.get('notifications', { page, limit });
}

export async function markNotificationAsRead(id) {
    const client = new APIClient();
    return client.put('notifications', { id });
}

export async function markAllNotificationsAsRead() {
    const client = new APIClient();
    return client.put('notifications', { mark_all: true });
}

export async function clearAllNotifications() {
    const client = new APIClient();
    return client.delete('notifications');
}

/**
 * Bulk Import Assets
 * @param {Array} assets - Array of asset objects
 */
export async function bulkImportAssets(assets) {
    const client = new APIClient();
    return client.post('assets/import', { assets });
}

export { APIClient };
