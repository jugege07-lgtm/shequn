// 通用类型定义
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

export interface UserPayload {
  userId: number;
  openid: string;
  role: string;
  adminLevel: number;
  vipLevel: number;
}

export interface ActivityPayload {
  id: number;
  title: string;
  coverImage: string;
  description: string;
  status: string;
  price: number;
  location: string;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  signupCount: number;
  publisherId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessPayload {
  id: number;
  title: string;
  coverImage: string;
  description: string;
  categoryId: number;
  contactName: string;
  contactPhone: string;
  contactWechat: string;
  unlockFee: number;
  maxUnlocks: number;
  currentUnlocks: number;
  status: string;
  publisherId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPayload {
  id: number;
  name: string;
  coverImage: string;
  description: string;
  price: number;
  vipPrice: number;
  stock: number;
  salesCount: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}
