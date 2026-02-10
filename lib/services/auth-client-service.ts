import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    businessName: string;
  };
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  businessName: string;
  businessPhone: string;
  businessAddress?: string;
}

class AuthClientService {
  private token: string | null = null;

  async initialize() {
    this.token = await AsyncStorage.getItem('auth_token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل تسجيل الدخول');
      }

      const data: AuthResponse = await response.json();
      
      // حفظ التوكن
      await AsyncStorage.setItem('auth_token', data.token);
      this.token = data.token;

      return data;
    } catch (error) {
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل التسجيل');
      }

      const authData: AuthResponse = await response.json();
      
      // حفظ التوكن
      await AsyncStorage.setItem('auth_token', authData.token);
      this.token = authData.token;

      return authData;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
      this.token = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  getAuthHeader(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const authService = new AuthClientService();
