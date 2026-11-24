import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { uid } from '../lib/format';
import type { CartItem, Category, CategoryGroup, MeasurementKey, Need, Order, Profile } from '../types';

export interface State {
  profile: Profile;
  needs: Need[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
}

export type Action =
  | { type: 'profile/name'; name: string }
  | { type: 'profile/preferredSize'; group: CategoryGroup; size: string }
  | { type: 'profile/measurement'; category: Category; key: MeasurementKey; value: number | undefined }
  | { type: 'profile/clearCategory'; category: Category }
  | { type: 'profile/tolerance'; value: number }
  | { type: 'needs/add'; need: Pick<Need, 'category' | 'note' | 'maxPrice'> }
  | { type: 'needs/toggleDone'; id: string }
  | { type: 'needs/remove'; id: string }
  | { type: 'cart/add'; productId: string; size: string }
  | { type: 'cart/setQty'; productId: string; size: string; qty: number }
  | { type: 'cart/remove'; productId: string; size: string }
  | { type: 'wishlist/toggle'; productId: string }
  | { type: 'order/place'; order: Order; fulfilledNeedIds: string[] }
  | { type: 'reset' };

const STORAGE_KEY = 'fitfind:v1';

export const initialState: State = {
  profile: {
    name: 'guest',
    preferredSizes: { top: 'M', bottom: '32' },
    fit: {
      tshirt: { chest: 54, shoulder: 47, length: 72, sleeve: 21 },
      shirt: { chest: 54, shoulder: 47, length: 72, sleeve: 21 },
      jeans: { waist: 41.5, inseam: 81, rise: 28, thigh: 32 },
    },
    tolerance: 2,
  },
  needs: [
    { id: 'n1', category: 'tshirt', note: 'white tee, boxy fit', done: false, createdAt: 0 },
    { id: 'n2', category: 'jeans', note: 'dark straight jeans', maxPrice: 120, done: false, createdAt: 0 },
    { id: 'n3', category: 'jacket', note: 'light transitional jacket', done: false, createdAt: 0 },
  ],
  cart: [],
  wishlist: [],
  orders: [],
};

const sameLine = (item: CartItem, productId: string, size: string) =>
  item.productId === productId && item.size === size;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'profile/name':
      return { ...state, profile: { ...state.profile, name: action.name } };
    case 'profile/preferredSize':
      return {
        ...state,
        profile: { ...state.profile, preferredSizes: { ...state.profile.preferredSizes, [action.group]: action.size } },
      };
    case 'profile/measurement': {
      const current = { ...state.profile.fit[action.category] };
      if (action.value == null || Number.isNaN(action.value)) delete current[action.key];
      else current[action.key] = action.value;
      return { ...state, profile: { ...state.profile, fit: { ...state.profile.fit, [action.category]: current } } };
    }
    case 'profile/clearCategory': {
      const fit = { ...state.profile.fit };
      delete fit[action.category];
      return { ...state, profile: { ...state.profile, fit } };
    }
    case 'profile/tolerance':
      return { ...state, profile: { ...state.profile, tolerance: action.value } };
    case 'needs/add':
      return {
        ...state,
        needs: [...state.needs, { ...action.need, id: uid(), done: false, createdAt: Date.now() }],
      };
    case 'needs/toggleDone':
      return { ...state, needs: state.needs.map((n) => (n.id === action.id ? { ...n, done: !n.done } : n)) };
    case 'needs/remove':
      return { ...state, needs: state.needs.filter((n) => n.id !== action.id) };
    case 'cart/add': {
      const existing = state.cart.find((i) => sameLine(i, action.productId, action.size));
      const cart = existing
        ? state.cart.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i))
        : [...state.cart, { productId: action.productId, size: action.size, qty: 1 }];
      return { ...state, cart };
    }
    case 'cart/setQty':
      return {
        ...state,
        cart: state.cart
          .map((i) => (sameLine(i, action.productId, action.size) ? { ...i, qty: action.qty } : i))
          .filter((i) => i.qty > 0),
      };
    case 'cart/remove':
      return { ...state, cart: state.cart.filter((i) => !sameLine(i, action.productId, action.size)) };
    case 'wishlist/toggle':
      return {
        ...state,
        wishlist: state.wishlist.includes(action.productId)
          ? state.wishlist.filter((id) => id !== action.productId)
          : [...state.wishlist, action.productId],
      };
    case 'order/place':
      return {
        ...state,
        cart: [],
        orders: [action.order, ...state.orders],
        needs: state.needs.map((n) => (action.fulfilledNeedIds.includes(n.id) ? { ...n, done: true } : n)),
      };
    case 'reset':
      return initialState;
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...initialState, ...parsed, profile: { ...initialState.profile, ...parsed.profile } };
  } catch {
    return initialState;
  }
}

const StoreContext = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
