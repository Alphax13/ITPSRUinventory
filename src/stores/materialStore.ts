// src/stores/materialStore.ts
import { create } from 'zustand';
import type { Material } from '../app/dashboard/materials/page';

interface MaterialState {
  isModalOpen: boolean;
  editingMaterial: Material | null; // Store material data when editing
  openModal: (material?: Material) => void;
  closeModal: () => void;
}

export const useMaterialStore = create<MaterialState>((set) => ({
  isModalOpen: false,
  editingMaterial: null,

  openModal: (material?: Material) => {
    set({ isModalOpen: true, editingMaterial: material || null });
  },
  closeModal: () => {
    set({ isModalOpen: false, editingMaterial: null });
  },
}));