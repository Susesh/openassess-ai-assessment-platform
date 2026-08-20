export interface User {
  id: number;
  name?: string;
  full_name?: string;
  email: string;
  role?: string;
  created_at?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
}
