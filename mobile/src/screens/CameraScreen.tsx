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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import Toast from 'react-native-toast-message';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { requestCameraPermission, requestGalleryPermission } from '../utils/permissions';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const { setLoading, addReceipt } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePicker = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      if (asset.uri) {
        setSelectedImage(asset.uri);
      }
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 2000,
      maxHeight: 2000,
    };

    launchCamera(options, handleImagePicker);
  };

  const handleSelectFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 2000,
      maxHeight: 2000,
    };

    launchImageLibrary(options, handleImagePicker);
  };

  const handleUploadImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      setLoading(true);

      // Generate unique upload ID
      const clientUploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get presigned upload URL
      const uploadResponse = await apiService.createUploadUrl(clientUploadId);

      // Upload file
      await apiService.uploadFile(uploadResponse.upload_url, imageUri);

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

  const handleConfirmImage = () => {
    if (selectedImage) {
      handleUploadImage(selectedImage);
    }
  };

  const handleRetakeImage = () => {
    setSelectedImage(null);
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

        {/* Image Preview or Camera Placeholder */}
        {selectedImage ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>
                Anteprima scontrino
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.cameraPreview}>
            <Text style={styles.cameraText}>
              📷 Fotocamera
            </Text>
            <Text style={styles.cameraSubtext}>
              Tocca per scattare una foto
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {selectedImage ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleConfirmImage}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Conferma e Invia</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleRetakeImage}
                disabled={isProcessing}
              >
                <Text style={styles.secondaryButtonText}>Rifai Foto</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleTakePhoto}
                disabled={isProcessing}
              >
                <Text style={styles.primaryButtonText}>Scatta Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleSelectFromGallery}
                disabled={isProcessing}
              >
                <Text style={styles.secondaryButtonText}>Da Galleria</Text>
              </TouchableOpacity>
            </>
          )}
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
  imagePreview: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    marginBottom: 20,
    minHeight: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
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
