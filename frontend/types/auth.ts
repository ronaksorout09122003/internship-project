export type UserRole = "MENTOR" | "STUDENT";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  headline: string | null;
  bio: string | null;
  timezone: string;
  skills: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
  headline?: string;
  timezone?: string;
  skills?: string;
  role: UserRole;
}

export interface UpdateProfilePayload {
  displayName: string;
  headline: string;
  bio: string;
  timezone: string;
  skills: string;
}
