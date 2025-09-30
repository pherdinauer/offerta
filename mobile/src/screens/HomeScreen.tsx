/**
 * Home Screen - Main entry point
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { receipts, isLoading } = useAppStore();

  const handleScanReceipt = () => {
    navigation.navigate('Camera');
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const getRecentReceipts = () => {
    return receipts.slice(0, 3);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>È un'offerta?</Text>
          <Text style={styles.subtitle}>
            Scatta la foto dello scontrino e scopri se è davvero un'offerta
          </Text>
        </View>

        {/* Main Action */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanReceipt}
          disabled={isLoading}
        >
          <Text style={styles.scanButtonText}>
            {isLoading ? 'Elaborazione...' : 'Scatta Scontrino'}
          </Text>
        </TouchableOpacity>

        {/* Recent Receipts */}
        {getRecentReceipts().length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Scontrini Recenti</Text>
            {getRecentReceipts().map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                style={styles.receiptCard}
                onPress={() => navigation.navigate('Result', {
                  receiptId: receipt.id,
                  status: receipt.status,
                })}
              >
                <Text style={styles.receiptDate}>
                  {new Date(receipt.created_at).toLocaleDateString('it-IT')}
                </Text>
                <Text style={styles.receiptStatus}>
                  {receipt.status === 'ready' ? 'Analizzato' : 'In elaborazione'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Secondary Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewHistory}
          >
            <Text style={styles.secondaryButtonText}>Storico</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  receiptCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  receiptStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
