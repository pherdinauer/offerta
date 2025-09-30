/**
 * Result Screen - Show analysis results
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import { Receipt, ReceiptItem } from '../types';
import Toast from 'react-native-toast-message';

type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;
type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

const ResultScreen: React.FC = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();
  const { receiptId, status: initialStatus } = route.params;
  
  const { receipts, updateReceipt } = useAppStore();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceipt = async () => {
    try {
      const receiptData = await apiService.getReceipt(receiptId);
      setReceipt(receiptData);
      updateReceipt(receiptId, receiptData);
    } catch (error: any) {
      console.error('Failed to fetch receipt:', error);
      Toast.show({
        type: 'error',
        text1: 'Errore',
        text2: 'Impossibile caricare i risultati',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [receiptId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReceipt();
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
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
      case 'processing': return 'In elaborazione...';
      case 'failed': return 'Errore nell\'analisi';
      case 'queued': return 'In coda';
      default: return 'Sconosciuto';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'green': return '#4CAF50';
      case 'yellow': return '#FF9800';
      case 'red': return '#F44336';
      default: return '#666666';
    }
  };

  const getDecisionText = (decision: string) => {
    switch (decision) {
      case 'green': return '🟢 Ottima offerta!';
      case 'yellow': return '🟡 Prezzo normale';
      case 'red': return '🔴 Prezzo alto';
      default: return '❓ Non determinato';
    }
  };

  const renderItem = (item: ReceiptItem, index: number) => (
    <View key={index} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={[styles.decisionBadge, { backgroundColor: getDecisionColor(item.decision) }]}>
          <Text style={styles.decisionText}>
            {getDecisionText(item.decision)}
          </Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemPrice}>
          €{item.price_total.toFixed(2)}
          {item.unit_price && (
            <Text style={styles.unitPrice}>
              {' '}(€{item.unit_price.toFixed(2)}/{item.unit_price_uom || 'unità'})
            </Text>
          )}
        </Text>
        
        {item.size_value && item.size_uom && (
          <Text style={styles.itemSize}>
            {item.size_value} {item.size_uom}
          </Text>
        )}
      </View>

      {item.reasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          {item.reasons.map((reason, reasonIndex) => (
            <Text key={reasonIndex} style={styles.reasonText}>
              • {reason}
            </Text>
          ))}
        </View>
      )}

      {(item.last_price || item.avg_price) && (
        <View style={styles.priceHistory}>
          {item.last_price && (
            <Text style={styles.historyText}>
              Ultimo prezzo: €{item.last_price.toFixed(2)}
            </Text>
          )}
          {item.avg_price && (
            <Text style={styles.historyText}>
              Prezzo medio: €{item.avg_price.toFixed(2)}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analizzando lo scontrino...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Scontrino non trovato</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
            <Text style={styles.backButtonText}>Torna alla Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Stato Analisi</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) }]}>
            <Text style={styles.statusText}>
              {getStatusText(receipt.status)}
            </Text>
          </View>
        </View>

        {receipt.status === 'ready' && receipt.items.length > 0 ? (
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Riepilogo</Text>
              <Text style={styles.summaryText}>
                {receipt.items.length} prodotti analizzati
              </Text>
            </View>

            {/* Items */}
            <View style={styles.itemsContainer}>
              <Text style={styles.itemsTitle}>Prodotti</Text>
              {receipt.items.map((item, index) => renderItem(item, index))}
            </View>
          </>
        ) : receipt.status === 'ready' && receipt.items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nessun prodotto rilevato nello scontrino
            </Text>
          </View>
        ) : (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>
              {getStatusText(receipt.status)}
            </Text>
            <Text style={styles.processingSubtext}>
              Questo potrebbe richiedere alcuni secondi...
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
            <Text style={styles.backButtonText}>Torna alla Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  decisionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  decisionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  itemDetails: {
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  unitPrice: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  itemSize: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  reasonsContainer: {
    marginTop: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  priceHistory: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  historyText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  actions: {
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultScreen;
