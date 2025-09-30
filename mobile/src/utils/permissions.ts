/**
 * Permissions utility for camera and gallery access
 */
import { Platform, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

export const CAMERA_PERMISSION = Platform.OS === 'ios' 
  ? PERMISSIONS.IOS.CAMERA 
  : PERMISSIONS.ANDROID.CAMERA;

export const GALLERY_PERMISSION = Platform.OS === 'ios'
  ? PERMISSIONS.IOS.PHOTO_LIBRARY
  : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const result = await request(CAMERA_PERMISSION);
    
    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.DENIED) {
      Alert.alert(
        'Permesso Fotocamera',
        'Per scattare foto degli scontrini, è necessario concedere l\'accesso alla fotocamera.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Impostazioni', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    } else {
      Alert.alert(
        'Permesso Fotocamera',
        'L\'accesso alla fotocamera è stato negato. Per utilizzare questa funzionalità, abilita il permesso nelle impostazioni.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Impostazioni', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

export const requestGalleryPermission = async (): Promise<boolean> => {
  try {
    const result = await request(GALLERY_PERMISSION);
    
    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.DENIED) {
      Alert.alert(
        'Permesso Galleria',
        'Per selezionare foto dalla galleria, è necessario concedere l\'accesso alla galleria.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Impostazioni', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    } else {
      Alert.alert(
        'Permesso Galleria',
        'L\'accesso alla galleria è stato negato. Per utilizzare questa funzionalità, abilita il permesso nelle impostazioni.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Impostazioni', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('Error requesting gallery permission:', error);
    return false;
  }
};