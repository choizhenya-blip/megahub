import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_QTY = 50;

export interface CartItem {
  id: string;
  /** Article number / SKU — passed to 1C and CRM integrations. */
  sku: string;
  titles: { ru: string; kz: string; en: string };
  subjects: { ru: string; kz: string; en: string };
  price: number;
  qty: number;
  /** Actual warehouse stock at the time of adding. Cart never exceeds this. */
  stock: number;
}

interface CartStore {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        const effectiveMax = Math.min(MAX_QTY, item.stock);
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          if (existing.qty >= effectiveMax) return;
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, qty: Math.min(i.qty + 1, effectiveMax) } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, qty: 1 }] });
        }
      },

      remove: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      /** Set exact quantity. Removes item when qty <= 0, clamps to min(MAX_QTY, stock). */
      setQty: (id, qty) => {
        const existing = get().items.find((i) => i.id === id);
        const effectiveMax = existing ? Math.min(MAX_QTY, existing.stock) : MAX_QTY;
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
        } else {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, qty: Math.min(qty, effectiveMax) } : i
            ),
          });
        }
      },

      clear: () => set({ items: [] }),
    }),
    { name: "megahub-cart" }
  )
);
