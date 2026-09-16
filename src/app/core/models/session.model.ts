export interface SessionUser {
  id?: number;
  username: string;
  nombre?: string;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario?: SessionUser;
}
