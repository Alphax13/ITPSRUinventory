// src/stores/materialStore.ts
import { create } from 'zustand';

interface MaterialState {
  isModalOpen: boolean;
  editingMaterial: any | null; // Store material data when editing
  openModal: (material?: any) => void;
  closeModal: () => void;
}

export const useMaterialStore = create<MaterialState>((set) => ({
  isModalOpen: false,
  editingMaterial: null,

  openModal: (material = null) => {
    set({ isModalOpen: true, editingMaterial: material });
  },
  closeModal: () => {
    set({ isModalOpen: false, editingMaterial: null });
  },
}));