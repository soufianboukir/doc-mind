export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  is_active: boolean;
}

export interface TokenResponse {
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  display_name: string;
}
