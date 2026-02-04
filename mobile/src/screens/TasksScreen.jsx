// mobile/src/screens/TasksScreen.jsx - Main tasks list screen

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeBaseProvider, Box, Text, Badge, Button, Icon } from 'native-base';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import authService from '../services/authService';
import offlineService from '../services/offlineService';

const API_URL = process.env.API_URL || 'https://api.example.com';

export default function TasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/api/tasks`, {
        params: {
          status: filter === 'all' ? undefined : filter,
          limit: 100,
        },
        headers: {
          Authorization: `Bearer ${authService.accessToken}`,
        },
      });

      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Load tasks error:', error);
      // Try to load from cache
      const cachedTasks = await offlineService.getOfflineData('tasks');
      setTasks(cachedTasks);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    const status = await offlineService.getQueueStatus();
    if (status.total > 0) {
      await offlineService.syncPendingChanges();
    }
    setRefreshing(false);
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FFA500';
      case 'low':
        return '#4CAF50';
      default:
        return '#999999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in_progress':
        return 'clock';
      case 'pending':
        return 'circle-outline';
      default:
        return 'circle';
    }
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
    >
      <View style={styles.taskHeader}>
        <View style={styles.titleSection}>
          <MaterialCommunityIcons
            name={getStatusIcon(item.status)}
            size={24}
            color={getPriorityColor(item.priority)}
          />
          <View style={styles.titleContent}>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.taskDate}>
              Due: {new Date(item.due_date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Badge
          style={{
            backgroundColor: getPriorityColor(item.priority),
            paddingHorizontal: 8,
          }}
        >
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </Badge>
      </View>

      {item.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.taskFooter}>
        <View style={styles.assignee}>
          <MaterialCommunityIcons name="account" size={16} color="#666" />
          <Text style={styles.assigneeText}>
            {item.assigned_to_name || 'Unassigned'}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${item.progress || 0}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{item.progress || 0}%</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <NativeBaseProvider>
      <Box style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'pending', 'completed'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                filter === f && styles.filterTabActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="inbox-outline"
              size={48}
              color="#CCC"
            />
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* FAB - Create Task */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateTask')}
        >
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>
      </Box>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
  },
  filterTabActive: {
    backgroundColor: '#0066CC',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  filterTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 12,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  titleContent: {
    flex: 1,
    marginLeft: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskFooter: {
    gap: 8,
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
