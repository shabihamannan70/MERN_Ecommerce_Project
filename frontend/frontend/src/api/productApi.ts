import axiosInstance from './axiosInstance';
import { Product } from '../types';

export const getAllProducts = async () => {
    try {
        const { data } = await axiosInstance.get('/product/get-product');
        return data.products as Product[];
    } catch (error) {
        console.error("Error fetching products", error);
        return [];
    }
};