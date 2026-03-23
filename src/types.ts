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
  category?: Category;
  categoryName: string;
  description?: string;
  isActive?: boolean;
  active?: boolean;
  liked?: boolean;
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
  gender?: ('MALE' | 'FEMALE' | 'UNISEX' | 'KIDS')[];
  categoryId?: number[];
  keyword?: string;
  color?: string[];
  productSize?: string[];
  sortBy?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateProductRequest {
  title: string;
  originalPrice: number;
  discountPrice: number;
  discountRate: number;
  gender: 'MALE' | 'FEMALE' | 'UNISEX' | 'KIDS';
  description: string;
  categoryId: number;
  isActive?: boolean;
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
      sku?: string;
    }[];
  }[];
}

export interface Banner {
  id: number;
  imageUrl: string;
  mobileImageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  sortOrder: number;
  placement: string;
  active: boolean;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  profilePicture: string | null;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneNumberVerified: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

export interface Review {
  id?: number;
  active: boolean;
  description: string;
  rate: number;
  userId: number;
  user?: User;
}
