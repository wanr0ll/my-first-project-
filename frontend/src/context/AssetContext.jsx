import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import * as API from '../services/api';
import { getDefaultImage } from '../utils/assetImages';

const AssetContext = createContext();

export const useAssets = () => useContext(AssetContext);

export const AssetProvider = ({ children }) => {
    const { addToast } = useToast();
    const [assets, setAssets] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load initial data from API only if authenticated
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            loadAssets();
            loadActivities();
        }
    }, []);

    const loadAssets = async () => {
        try {
            setLoading(true);
            const response = await API.getAssets('all', 1, 1000);
            const augmentedAssets = (response.data || []).map(asset => ({
                ...asset,
                image: asset.image || getDefaultImage(asset)
            }));
            setAssets(augmentedAssets);
        } catch (error) {
            console.error('Failed to load assets:', error);
            const token = localStorage.getItem('auth_token');
            if (token) {
                addToast('Failed to load assets', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadActivities = async () => {
        try {
            const response = await API.getRecentActivity(10);
            setActivities(response.data || []);
        } catch (error) {
            console.error('Failed to load activity:', error);
        }
    };

    // CRUD Operations
    const addAsset = async (newAsset) => {
        try {
            const response = await API.createAsset(newAsset);

            if (response.success) {
                addToast('Asset created successfully', 'success');
                await loadAssets();
                return { success: true, id: response.data?.id };
            } else {
                addToast(response.message || 'Failed to create asset', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error creating asset:', error);
            addToast(error.message || 'Failed to create asset', 'error');
            return { success: false };
        }
    };

    const updateAsset = async (updatedAsset, options = {}) => {
        try {
            const response = await API.updateAsset(updatedAsset);

            if (response.success) {
                if (!options.silent) addToast('Asset updated successfully', 'success');
                if (!options.skipRefresh) await loadAssets();
                return { success: true };
            } else {
                if (!options.silent) addToast(response.message || 'Failed to update asset', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error updating asset:', error);
            if (!options.silent) addToast(error.message || 'Failed to update asset', 'error');
            return { success: false };
        }
    };

    const transferAsset = async (transferData) => {
        try {
            const response = await API.transferAsset(transferData);

            if (response.success) {
                addToast('Asset transferred successfully', 'success');
                await loadAssets();
                return { success: true };
            } else {
                addToast(response.message || 'Failed to transfer asset', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error transferring asset:', error);
            addToast(error.message || 'Failed to transfer asset', 'error');
            return { success: false };
        }
    };

    const deleteAsset = async (assetId, options = {}) => {
        try {
            const response = await API.deleteAsset('all', assetId);

            if (response.success) {
                if (!options.silent) addToast('Asset deleted successfully', 'success');
                if (!options.skipRefresh) await loadAssets();
                return { success: true };
            } else {
                if (!options.silent) addToast(response.message || 'Failed to delete asset', 'error');
                return { success: false };
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            if (!options.silent) addToast(error.message || 'Failed to delete asset', 'error');
            return { success: false };
        }
    };

    const value = {
        assets,
        activities,
        loading,
        addAsset,
        updateAsset,
        transferAsset,
        deleteAsset,
        loadAssets,
        refreshAssets: loadAssets,
        loadActivities
    };

    return (
        <AssetContext.Provider value={value}>
            {children}
        </AssetContext.Provider>
    );
};
