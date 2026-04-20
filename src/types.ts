export interface Category {
  id: number;
  name: string;
  parentName: string;
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
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate: string;
  profilePicture: string | null;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  emailVerified?: boolean;
  phoneNumberVerified?: boolean;
}

export interface UserAdminFilter {
  page?: number;
  size?: number;
  genders?: ('MALE' | 'FEMALE' | 'UNKNOWN')[];
  roles?: string[];
  statuses?: string[];
  isEmailVerified?: boolean;
  isPhoneNumberVerified?: boolean;
  twoFactorEnabled?: boolean;
  direction?: 'ASC' | 'DESC';
  searchKeyword?: string;
  sortBy?: string;
}

export interface UserAdminPage {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  content: User[];
  empty: boolean;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate: string;
  profilePicture: string | null;
  role: 'USER' | 'ADMIN';
  status: string;
  emailVerified: boolean;
  phoneNumberVerified: boolean;
}

export interface Address {
  id: number;
  title: string;
  city: string;
  region: string;
  street: string;
  block: string;
  floor: string;
  doorNumber: string;
  doorCode: string;
  fullAddressText: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface AddressRequest {
  title: string;
  city: string;
  region: string;
  street: string;
  block: string;
  floor: string;
  doorNumber: string;
  doorCode: string;
  fullAddressText: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface ReviewPage {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Review[];
  number: number;
  numberOfElements: number;
  empty: boolean;
}

export interface Review {
  id?: number;
  isActive: boolean;
  description: string;
  rate: number;
  userId: number;
  user?: User;
  product?: Product;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate: string;
}

export interface CartItemData {
  id: number;
  productItemId: number;
  productName: string;
  colorName: string;
  imageUrl: string;
  sizeValue: string;
  quantity: number;
  slug: string;
  originalUnitPrice: number;
  actualUnitPrice: number;
  originalSubTotal: number;
  subTotal: number;
}

export interface CartData {
  id: number;
  userId: number;
  items: CartItemData[];
  totalOriginalPrice: number;
  totalPrice: number;
  shippingFee: number;
  couponApplied: boolean;
  couponId: number | null;
}

export interface ContactMessageRequest {
  userId: number;
  email: string;
  fullName: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  subject: string;
  message: string;
  answered: boolean;
}
