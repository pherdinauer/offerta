/**
 * API service for backend communication
 */
import axios, { AxiosResponse } from 'axios';
import { 
  UploadResponse, 
  ReceiptResponse, 
  Receipt, 
  OfferCheckResponse,
  ApiError 
} from '../types';

const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000/api/v1'  // Android emulator
  : 'https://api.offerta.com/api/v1';  // Production

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    const apiError: ApiError = {
      message: error.response?.data?.detail || error.message || 'Unknown error',
      status: error.response?.status || 500,
    };
    return Promise.reject(apiError);
  }
);

export const apiService = {
  /**
   * Generate presigned upload URL
   */
  async createUploadUrl(clientUploadId: string): Promise<UploadResponse> {
    const response = await api.post('/uploads', {
      client_upload_id: clientUploadId,
    });
    return response.data;
  },

  /**
   * Upload file to presigned URL
   */
  async uploadFile(uploadUrl: string, fileUri: string): Promise<void> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      // Upload to presigned URL
      await axios.put(uploadUrl, formData, {
        headers: {
          'Content-Type': 'image/jpeg',
        },
        timeout: 30000, // 30 seconds timeout
      });
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image');
    }
  },

  /**
   * Create receipt and queue processing
   */
  async createReceipt(
    fileKey: string,
    storeHint?: string,
    purchasedAt?: string,
    clientUploadId?: string
  ): Promise<ReceiptResponse> {
    const response = await api.post('/receipts', {
      file_key: fileKey,
      store_hint: storeHint,
      purchased_at: purchasedAt,
      client_upload_id: clientUploadId,
    });
    return response.data;
  },

  /**
   * Get receipt status and results
   */
  async getReceipt(receiptId: number): Promise<Receipt> {
    const response = await api.get(`/receipts/${receiptId}`);
    return response.data;
  },

  /**
   * Check offer for barcode
   */
  async checkOffer(
    ean: string,
    price: number,
    size: number,
    uom: string
  ): Promise<OfferCheckResponse> {
    const response = await api.get('/offer-check', {
      params: { ean, price, size, uom },
    });
    return response.data;
  },

  /**
   * Export user data
   */
  async exportData(): Promise<{ download_url: string; expires_in: number }> {
    const response = await api.get('/me/export');
    return response.data;
  },

  /**
   * Delete user data
   */
  async deleteData(): Promise<{ message: string }> {
    const response = await api.delete('/me/data');
    return response.data;
  },
};

export default apiService;
