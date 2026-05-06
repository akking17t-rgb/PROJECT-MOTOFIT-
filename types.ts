export type VehicleType = 'Bike' | 'Car';

export type BikeBrand = 'Honda' | 'Yamaha' | 'Suzuki Pakistan' | 'United' | 'Road Prince' | 'Kawasaki' | 'BMW';
export type CarBrand = 'Toyota' | 'Honda' | 'Suzuki' | 'Kia' | 'Changan' | 'MG' | 'Hyundai';

export interface VehicleModel {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  years: number[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  userImage?: string;
  vehicle?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  type: VehicleType | 'Universal';
  category: string;
  description: string;
  image: string;
  fitment: {
    brands: string[];
    models?: string[];
    years?: [number, number];
  };
  rating: number;
  reviewCount: number;
  featured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
