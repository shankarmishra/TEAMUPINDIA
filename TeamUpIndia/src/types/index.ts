// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'coach' | 'seller' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Coach Types
export interface Coach {
  id: string;
  userId: string;
  sports: string[];
  experience: number;
  hourlyRate: number;
  availability: Availability[];
  rating: number;
  reviews: Review[];
}

// Team Types
export interface Team {
  id: string;
  name: string;
  sport: string;
  captain: string;
  members: string[];
  location: Location;
  createdAt: string;
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  teams: string[];
  venue: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  seller: string;
  stock: number;
  rating: number;
}

// Order Types
export interface Order {
  id: string;
  user: string;
  products: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}

// Common Types
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  CoachDetails: { coachId: string };
  TeamDetails: { teamId: string };
  TournamentDetails: { tournamentId: string };
  ProductDetails: { productId: string };
  OrderDetails: { orderId: string };
}; 