export interface Category {
  id: number;
  name: string;
  subtitle: string;
  link: string;
  mainImage: string;
  parent: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  errorCode: string | null;
  data: T;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

export interface ProductSize {
  id: number;
  sizeValue: string;
}

export interface Color {
  id: number;
  colorName: string;
  colorCode: string;
}

export interface ProductItem {
  id: number;
  productSize: ProductSize;
  sku: string;
  stockQuantity: number;
  stockRemaining: number;
  deleted?: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  main: boolean;
}

export interface ProductColor {
  id: number;
  colorName: string;
  colorCode: string;
  images: ProductImage[];
  items: ProductItem[];
}

export interface Product {
  id: number;
  title: string;
  originalPrice: number;
  discountPrice: number;
  discountRate: number;
  hasDiscount: boolean;
  slug: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX' | 'KIDS';
  categoryName: string;
  description?: string;
  isActive: boolean;
  active?: boolean;
  isDeleted: boolean;
  colors: ProductColor[];
}

export interface ProductPage {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Product[];
  number: number;
  numberOfElements: number;
  empty: boolean;
}

export interface ProductFilter {
  page?: number;
  size?: number;
  direction?: 'ASC' | 'DESC';
  gender?: 'MALE' | 'FEMALE' | 'UNISEX' | 'KIDS' | '';
  categoryId?: number | null;
  keyword?: string;
  color?: string;
  productSize?: string;
  sortBy?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  minPrice?: number | string;
  maxPrice?: number | string;
}

export interface CreateProductRequest {
  title: string;
  originalPrice: number;
  discountPrice: number;
  discountRate: number;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  description: string;
  categoryId: number;
  colors: {
    colorName: string;
    colorCode: string;
    images: {
      image: string;
      isMain: boolean;
    }[];
    items: {
      sizeId: number;
      stockQuantity: number;
    }[];
  }[];
}
