/**
 * B2B quote cart — stores items for a wholesale quote request.
 * No price tracking; quantities are unlimited.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface B2bCartItem {
  id: string;       // book UUID
  sku: string;
  title_ru: string;
  title_kz?: string;
  title_en?: string;
  author?: string;
  qty: number;
}

interface B2bCartStore {
  items: B2bCartItem[];
  add: (item: Omit<B2bCartItem, "qty"> & { qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useB2bCartStore = create<B2bCartStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty: item.qty ?? 1 }] };
        }),
      setQty: (id, qty) =>
        set((state) => ({
          items: qty <= 0
            ? state.items.filter((i) => i.id !== id)
            : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "b2b-cart" }
  )
);
