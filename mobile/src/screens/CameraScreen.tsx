/**
 * Camera Screen - Take receipt photo
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import Toast from 'react-native-toast-message';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const { setLoading, addReceipt } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTakePhoto = async () => {
    try {
      setIsProcessing(true);
      setLoading(true);

      // Generate unique upload ID
      const clientUploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get presigned upload URL
      const uploadResponse = await apiService.createUploadUrl(clientUploadId);

      // For demo purposes, we'll simulate the upload
      // In a real app, you would use react-native-image-picker or react-native-camera
      const mockFileUri = 'file://mock_receipt.jpg';

      // Upload file
      await apiService.uploadFile(uploadResponse.upload_url, mockFileUri);

      // Create receipt
      const receiptResponse = await apiService.createReceipt(
        uploadResponse.file_key,
        undefined, // store_hint
        undefined, // purchased_at
        clientUploadId
      );

      // Add to store
      const newReceipt = {
        id: receiptResponse.id,
        status: receiptResponse.status as any,
        items: [],
        created_at: new Date().toISOString(),
      };
      addReceipt(newReceipt);

      Toast.show({
        type: 'success',
        text1: 'Scontrino inviato!',
        text2: 'Stiamo analizzando la tua ricevuta...',
      });

      // Navigate to result screen
      navigation.navigate('Result', {
        receiptId: receiptResponse.id,
        status: receiptResponse.status,
      });

    } catch (error: any) {
      console.error('Upload failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Errore',
        text2: error.message || 'Impossibile inviare lo scontrino',
      });
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleSelectFromGallery = () => {
    // TODO: Implement gallery selection
    Alert.alert(
      'Seleziona da galleria',
      'Questa funzionalità sarà disponibile presto',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>
            Come scattare una buona foto
          </Text>
          <Text style={styles.instructionText}>
            • Assicurati che lo scontrino sia ben visibile{'\n'}
            • Evita riflessi e ombre{'\n'}
            • Mantieni la fotocamera stabile{'\n'}
            • Inquadra tutto lo scontrino
          </Text>
        </View>

        {/* Camera Preview Placeholder */}
        <View style={styles.cameraPreview}>
          <Text style={styles.cameraText}>
            📷 Fotocamera
          </Text>
          <Text style={styles.cameraSubtext}>
            Tocca per scattare una foto
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleTakePhoto}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Scatta Foto</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleSelectFromGallery}
            disabled={isProcessing}
          >
            <Text style={styles.secondaryButtonText}>Da Galleria</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tips}>
          <Text style={styles.tipText}>
            💡 Suggerimento: Una foto nitida aiuta l'analisi automatica
          </Text>
        </View>
      </View>
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
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 300,
  },
  cameraText: {
    fontSize: 48,
    marginBottom: 8,
  },
  cameraSubtext: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  tips: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
});

export default CameraScreen;
