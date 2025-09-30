/**
 * Zustand store for app state management
 */
import { create } from 'zustand';
import { Receipt } from '../types';

interface AppState {
  // Receipts
  receipts: Receipt[];
  currentReceipt: Receipt | null;
  isLoading: boolean;
  
  // Actions
  setReceipts: (receipts: Receipt[]) => void;
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (id: number, updates: Partial<Receipt>) => void;
  setCurrentReceipt: (receipt: Receipt | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Clear all data
  clearAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  receipts: [],
  currentReceipt: null,
  isLoading: false,
  
  // Actions
  setReceipts: (receipts) => set({ receipts }),
  
  addReceipt: (receipt) => set((state) => ({
    receipts: [receipt, ...state.receipts],
  })),
  
  updateReceipt: (id, updates) => set((state) => ({
    receipts: state.receipts.map((receipt) =>
      receipt.id === id ? { ...receipt, ...updates } : receipt
    ),
  })),
  
  setCurrentReceipt: (receipt) => set({ currentReceipt: receipt }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  clearAll: () => set({
    receipts: [],
    currentReceipt: null,
    isLoading: false,
  }),
}));
