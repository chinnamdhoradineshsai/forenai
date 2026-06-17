export interface User {
  id: string;
  username: string;
  name: string;
  badgeNumber: string;
  role: string;
  email: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
