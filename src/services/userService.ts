// User service for MongoDB
interface User {
  id: string;
  email: string;
  profile?: {
    name?: string;
    preferences?: string[];
  };
}

export interface UserData {
  id?: string;
  email: string;
  name?: string;
  preferences?: string[];
}

export class UserService {
  private static instance: UserService;
  private apiUrl: string = 'http://192.168.249.135:3000/api';
  private authUrl: string = 'http://192.168.249.135:3000/api/auth';

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async signup(userData: UserData): Promise<{ token: string; user: UserData }> {
    try {
      console.log('Attempting signup with:', { ...userData, password: '***' });
      console.log('Signup URL:', `${this.authUrl}/signup`);
      const response = await fetch(`${this.authUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          url: `${this.authUrl}/signup`
        });
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: UserData }> {
    try {
      console.log('Attempting login to:', `${this.authUrl}/login`);
      const response = await fetch(`${this.authUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      console.error('Login request failed to:', `${this.authUrl}/login`);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      throw error;
    }
  }

  async updateUser(userData: Partial<UserData>): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/users/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const baseUrl = this.apiUrl.replace('/api', '');
      console.log('Testing connection to:', `${baseUrl}/test`);
      const response = await fetch(`${baseUrl}/test`);
      const data = await response.json();
      console.log('Server response:', data);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      return false;
    }
  }

  async getTestToken(): Promise<{ token: string; user: UserData }> {
    try {
      console.log('Getting test token from:', `${this.authUrl}/test-token`);
      const response = await fetch(`${this.authUrl}/test-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get test token');
      }

      const data = await response.json();
      return data.data; // The token and user are nested in a data property
    } catch (error) {
      console.error('Error getting test token:', error);
      throw error;
    }
  }

  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const response = await fetch(`${this.apiUrl}/users/${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }
};
