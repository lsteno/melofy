// src/services/auth.ts
import { api } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  login: (data: LoginData) => 
    api.post('/auth/login', data),
  
  register: (data: LoginData) => 
    api.post('/auth/register', data),
    
  logout: () => 
    api.post('/auth/logout')
};