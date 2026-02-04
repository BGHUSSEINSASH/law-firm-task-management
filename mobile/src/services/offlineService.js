// mobile/src/services/offlineService.js - Offline data sync for mobile

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

const API_URL = process.env.API_URL || 'https://api.example.com';

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.init();
  }

  /**
   * Initialize offline service
   */
  async init() {
    // Monitor network connectivity
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected && state.isInternetReachable;

      if (this.isOnline) {
        // Sync pending changes
        this.syncPendingChanges();
      }
    });
  }

  /**
   * Save data offline
   */
  async saveOffline(key, data) {
    try {
      const timestamp = Date.now();
      const offlineData = {
        id: `offline_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        key,
        data,
        timestamp,
        synced: false,
      };

      // Save to local storage
      const existingData = await this.getOfflineData(key);
      const allData = [...(existingData || []), offlineData];

      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify(allData));

      // Add to sync queue
      this.syncQueue.push(offlineData);

      return offlineData;
    } catch (error) {
      console.error('Offline save error:', error);
      throw error;
    }
  }

  /**
   * Get offline data
   */
  async getOfflineData(key) {
    try {
      const data = await AsyncStorage.getItem(`offline_${key}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get offline data error:', error);
      return [];
    }
  }

  /**
   * Sync pending changes with server
   */
  async syncPendingChanges() {
    try {
      if (!this.isOnline) {
        return { success: false, reason: 'offline' };
      }

      const taskData = await this.getOfflineData('tasks');
      const commentData = await this.getOfflineData('comments');
      const timeLogData = await this.getOfflineData('timeLogs');

      const allPending = [...taskData, ...commentData, ...timeLogData].filter(
        (item) => !item.synced
      );

      let syncedCount = 0;

      for (const item of allPending) {
        try {
          const result = await this.syncItem(item);
          if (result.success) {
            syncedCount++;
            // Mark as synced
            await this.markAsSynced(item.id);
          }
        } catch (error) {
          console.error(`Failed to sync ${item.id}:`, error.message);
        }
      }

      return {
        success: true,
        synced: syncedCount,
        total: allPending.length,
      };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync individual item
   */
  async syncItem(item) {
    try {
      const { key, data, id } = item;

      let endpoint = '';
      let method = 'POST';

      switch (key) {
        case 'tasks':
          endpoint = data.id ? `/api/tasks/${data.id}` : '/api/tasks';
          method = data.id ? 'PUT' : 'POST';
          break;
        case 'comments':
          endpoint = data.id ? `/api/comments/${data.id}` : `/api/comments/${data.taskId}`;
          method = data.id ? 'PUT' : 'POST';
          break;
        case 'timeLogs':
          endpoint = '/api/time-tracking/stop';
          method = 'POST';
          break;
        default:
          return { success: false, error: 'Unknown data type' };
      }

      const response = await axios({
        method,
        url: `${API_URL}${endpoint}`,
        data: data,
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark item as synced
   */
  async markAsSynced(itemId) {
    try {
      const keys = [
        'offline_tasks',
        'offline_comments',
        'offline_timeLogs',
      ];

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const items = JSON.parse(data);
          const updated = items.map((item) =>
            item.id === itemId ? { ...item, synced: true } : item
          );
          await AsyncStorage.setItem(key, JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('Mark synced error:', error);
    }
  }

  /**
   * Clear synced items
   */
  async clearSyncedItems() {
    try {
      const keys = [
        'offline_tasks',
        'offline_comments',
        'offline_timeLogs',
      ];

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const items = JSON.parse(data);
          const pending = items.filter((item) => !item.synced);
          await AsyncStorage.setItem(key, JSON.stringify(pending));
        }
      }
    } catch (error) {
      console.error('Clear synced error:', error);
    }
  }

  /**
   * Get access token
   */
  async getAccessToken() {
    const tokens = await AsyncStorage.getItem('authTokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      return accessToken;
    }
    return null;
  }

  /**
   * Get offline queue status
   */
  async getQueueStatus() {
    try {
      const taskData = await this.getOfflineData('tasks');
      const commentData = await this.getOfflineData('comments');
      const timeLogData = await this.getOfflineData('timeLogs');

      const pending = [
        ...taskData,
        ...commentData,
        ...timeLogData,
      ].filter((item) => !item.synced);

      return {
        total: pending.length,
        tasks: taskData.filter((t) => !t.synced).length,
        comments: commentData.filter((c) => !c.synced).length,
        timeLogs: timeLogData.filter((t) => !t.synced).length,
      };
    } catch (error) {
      return { total: 0, tasks: 0, comments: 0, timeLogs: 0 };
    }
  }
}

export default new OfflineService();
