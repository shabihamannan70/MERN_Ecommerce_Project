// src/types/index.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  role: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductDetail {
  _id?: string;
  material: string;
  dimensions: string;
  color: string;
  price: number;
  stock: number;
  quantity: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: Category; // Populate করার পর এটি অবজেক্ট হয়ে যাবে
  isAvailable: boolean;
  productDetails: ProductDetail[];
}