/**
 * Type definitions for the app
 */

export interface Receipt {
  id: number;
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'needs_review';
  items: ReceiptItem[];
  created_at: string;
}

export interface ReceiptItem {
  product_id?: number;
  name: string;
  brand?: string;
  size_value?: number;
  size_uom?: string;
  qty: number;
  price_total: number;
  unit_price?: number;
  unit_price_uom?: string;
  last_price?: number;
  avg_price?: number;
  decision: 'green' | 'yellow' | 'red' | 'unknown';
  reasons: string[];
}

export interface UploadResponse {
  upload_url: string;
  file_key: string;
  expires_in: number;
}

export interface ReceiptResponse {
  id: number;
  status: string;
}

export interface OfferCheckResponse {
  product_id?: number;
  unit_price?: number;
  unit_price_uom?: string;
  decision: string;
  reasons: string[];
}

export interface ApiError {
  message: string;
  status: number;
}
