import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiService } from '../services/api';
import type { HistoryEntry } from '../types';

export default function HistoryScreen({ navigation, route }: any) {
  const { user, token } = route.params;
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getHistory();
      setHistory(data);
    } catch (e: any) {
      console.log('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <View style={[styles.historyItem, item.status === 'success' ? styles.successItem : styles.failItem]}>
      <View style={styles.historyRow}>
        <Text style={styles.endpoint}>{item.endpoint}</Text>
        <Text style={[styles.status, item.status === 'success' ? styles.successStatus : styles.failStatus]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003366" />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No history yet</Text>
          <Text style={styles.emptySubtext}>Process a transcript to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003366']} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#003366',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, color: '#64748b', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#94a3b8' },
  list: { padding: 16 },
  historyItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  successItem: { borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  failItem: { borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  endpoint: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  status: { fontSize: 12, fontWeight: '500' },
  successStatus: { color: '#22c55e' },
  failStatus: { color: '#dc2626' },
  timestamp: { fontSize: 12, color: '#64748b' },
});