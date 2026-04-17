import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiService } from '../services/api';
import type { Certificate } from '../types';

export default function CertificatesScreen({ navigation, route }: any) {
  const { user, token } = route.params;
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const certs = await ApiService.getCertificates();
      setCertificates(certs);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderItem = ({ item }: { item: Certificate }) => (
    <View style={styles.certItem}>
      <Text style={styles.certIcon}>📜</Text>
      <View style={styles.certInfo}>
        <Text style={styles.certFilename} numberOfLines={1}>{item.filename}</Text>
        <Text style={styles.certDate}>{formatDate(item.timestamp)}</Text>
        <Text style={styles.certSize}>{formatSize(item.size)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificates</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003366" />
        </View>
      ) : certificates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No certificates yet</Text>
          <Text style={styles.emptySubtext}>Process a transcript to generate one</Text>
        </View>
      ) : (
        <FlatList
          data={certificates}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
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
  certItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  certIcon: { fontSize: 32, marginRight: 12 },
  certInfo: { flex: 1 },
  certFilename: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  certDate: { fontSize: 12, color: '#64748b' },
  certSize: { fontSize: 12, color: '#94a3b8' },
});