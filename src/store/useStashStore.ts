import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
export type StashItem = {
  id: string;
  url: string;
  type: 'reel' | 'video' | 'article' | 'note' | 'music';
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

interface StashState {
  items: StashItem[];
  folders: string[];
  geminiApiKey: string;
  theme: 'dark' | 'light' | 'system';
  addItem: (item: Omit<StashItem, 'id' | 'savedAt' | 'isFavorite' | 'isRead'>) => string;
  updateItem: (id: string, updates: Partial<StashItem>) => void;
  deleteItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleRead: (id: string) => void;
  setGeminiApiKey: (key: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  createFolder: (name: string) => void;
  deleteFolder: (name: string) => void;
  renameFolder: (oldName: string, newName: string) => void;
  clearAll: () => void;
}

const generateId = () => {
  return Crypto.randomUUID();
};

export const useStashStore = create<StashState>()(
  persist(
    (set) => ({
      items: [],
      folders: ['Starred'],
      geminiApiKey: '',
      theme: 'dark',
      addItem: (itemData) => {
        const id = generateId();
        const newItem: StashItem = {
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
      createFolder: (name) => {
        set((state) => ({
          folders: state.folders.includes(name) ? state.folders : [...state.folders, name]
        }));
      },
      deleteFolder: (name) => {
        set((state) => ({
          folders: state.folders.filter((f) => f !== name),
          items: state.items.map((item) => item.folder === name ? { ...item, folder: null } : item)
        }));
      },
      renameFolder: (oldName, newName) => {
        set((state) => ({
          folders: state.folders.map((f) => f === oldName ? newName : f),
          items: state.items.map((item) => item.folder === oldName ? { ...item, folder: newName } : item)
        }));
      },
      clearAll: () => {
        set({ items: [], folders: [] });
      },
    }),
    {
      name: 'stash-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
