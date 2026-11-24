export type Category = 'tshirt' | 'shirt' | 'hoodie' | 'jacket' | 'pants' | 'jeans' | 'shorts';
export type CategoryGroup = 'top' | 'bottom';

export type MeasurementKey =
  | 'chest'
  | 'shoulder'
  | 'length'
  | 'sleeve'
  | 'waist'
  | 'hip'
  | 'inseam'
  | 'rise'
  | 'thigh'
  | 'legOpening';

/** Garment measurements in cm, widths measured flat. */
export type Measurements = Partial<Record<MeasurementKey, number>>;

export type FitStyle = 'slim' | 'regular' | 'relaxed' | 'oversized';

export type Fiber = 'cotton' | 'wool' | 'linen' | 'polyester' | 'elastane' | 'viscose' | 'nylon';

export interface ProductEthics {
  fairTrade: boolean;
  organic: boolean;
  recycled: boolean;
}

export interface SizeVariant {
  size: string;
  measurements: Measurements;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  color: string;
  colorHex: string;
  material: string;
  fibers: Fiber[];
  originCountry: string;
  ethics: ProductEthics;
  fit: FitStyle;
  description: string;
  variants: SizeVariant[];
  imageUrl?: string;
  source: { shop: string; url: string };
}

export interface CartItem {
  productId: string;
  size: string;
  qty: number;
}

export interface Need {
  id: string;
  category: Category;
  note: string;
  maxPrice?: number;
  done: boolean;
  createdAt: number;
}

export interface Profile {
  name: string;
  preferredSizes: Record<CategoryGroup, string>;
  /** Target garment measurements per category, e.g. taken from a piece that fits well. */
  fit: Partial<Record<Category, Measurements>>;
  /** Allowed deviation in cm before the fit score drops noticeably. */
  tolerance: number;
}

export interface Address {
  name: string;
  email: string;
  street: string;
  zip: string;
  city: string;
  country: string;
}

export type ShippingMethod = 'standard' | 'express';
export type PaymentMethod = 'card' | 'paypal' | 'invoice';

export interface OrderLine extends CartItem {
  name: string;
  brand: string;
  price: number;
}

export interface Order {
  id: string;
  createdAt: number;
  lines: OrderLine[];
  address: Address;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  total: number;
}
