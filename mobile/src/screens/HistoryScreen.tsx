/**
 * History Screen - Show receipt history
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import { Receipt } from '../types';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'History'>;

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const { receipts, isLoading, setLoading } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch latest receipts from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleReceiptPress = (receipt: Receipt) => {
    navigation.navigate('Result', {
      receiptId: receipt.id,
      status: receipt.status,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'failed': return '#F44336';
      case 'queued': return '#2196F3';
      default: return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Analizzato';
      case 'processing': return 'In elaborazione';
      case 'failed': return 'Errore';
      case 'queued': return 'In coda';
      default: return 'Sconosciuto';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <TouchableOpacity
      style={styles.receiptCard}
      onPress={() => handleReceiptPress(item)}
    >
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptDate}>
          {formatDate(item.created_at)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      {item.status === 'ready' && item.items.length > 0 && (
        <View style={styles.receiptSummary}>
          <Text style={styles.itemsCount}>
            {item.items.length} prodotti analizzati
          </Text>
          
          {/* Show decision summary */}
          <View style={styles.decisionsSummary}>
            {item.items.filter(item => item.decision === 'green').length > 0 && (
              <Text style={[styles.decisionCount, { color: '#4CAF50' }]}>
                🟢 {item.items.filter(item => item.decision === 'green').length} ottime
              </Text>
            )}
            {item.items.filter(item => item.decision === 'yellow').length > 0 && (
              <Text style={[styles.decisionCount, { color: '#FF9800' }]}>
                🟡 {item.items.filter(item => item.decision === 'yellow').length} normali
              </Text>
            )}
            {item.items.filter(item => item.decision === 'red').length > 0 && (
              <Text style={[styles.decisionCount, { color: '#F44336' }]}>
                🔴 {item.items.filter(item => item.decision === 'red').length} care
              </Text>
            )}
          </View>
        </View>
      )}
      
      {item.status === 'processing' && (
        <View style={styles.processingInfo}>
          <ActivityIndicator size="small" color="#FF9800" />
          <Text style={styles.processingText}>
            Analisi in corso...
          </Text>
        </View>
      )}
      
      {item.status === 'failed' && (
        <View style={styles.errorInfo}>
          <Text style={styles.errorText}>
            ❌ Errore nell'analisi
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={styles.emptyTitle}>Nessuno scontrino</Text>
      <Text style={styles.emptyText}>
        I tuoi scontrini analizzati appariranno qui
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.scanButtonText}>Scatta il primo scontrino</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Storico Scontrini</Text>
        <Text style={styles.subtitle}>
          {receipts.length} scontrini analizzati
        </Text>
      </View>

      {isLoading && receipts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      ) : receipts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReceiptItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  listContainer: {
    padding: 20,
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  receiptSummary: {
    marginTop: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  decisionsSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  decisionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  processingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 8,
  },
  errorInfo: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HistoryScreen;
