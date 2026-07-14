import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TameItem = {
  id: string;
  url: string;
  type: 'reel' | 'video' | 'article' | 'note';
  title: string | null;
  thumbnailUrl: string | null;
  rawNoteText: string | null;
  aiSummary: string | null;
  aiTags: string[];
  folder: string | null;
  isFavorite: boolean;
  isRead: boolean;
  savedAt: number;
  status: 'pending' | 'enriched' | 'failed';
};

interface TameState {
  items: TameItem[];
  geminiApiKey: string;
  theme: 'dark' | 'light' | 'system';
  addItem: (item: Omit<TameItem, 'id' | 'savedAt' | 'isFavorite' | 'isRead'>) => string;
  updateItem: (id: string, updates: Partial<TameItem>) => void;
  deleteItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleRead: (id: string) => void;
  setGeminiApiKey: (key: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  clearAll: () => void;
}

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const useTameStore = create<TameState>()(
  persist(
    (set) => ({
      items: [],
      geminiApiKey: '',
      theme: 'dark',
      addItem: (itemData) => {
        const id = generateId();
        const newItem: TameItem = {
          ...itemData,
          id,
          savedAt: Date.now(),
          isFavorite: false,
          isRead: false,
        };
        set((state) => ({
          items: [newItem, ...state.items],
        }));
        return id;
      },
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      toggleFavorite: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
          ),
        }));
      },
      toggleRead: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isRead: !item.isRead } : item
          ),
        }));
      },
      setGeminiApiKey: (key) => {
        set({ geminiApiKey: key });
      },
      setTheme: (theme) => {
        set({ theme });
      },
      clearAll: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'tame-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
