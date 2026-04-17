import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import type { AuthResponse, TranscriptResult, HistoryEntry, Certificate } from '../types';

const SERVER_URL_KEY = 'server_url';
const DEFAULT_SERVER_URL = 'http://192.168.0.184:5000';

const GOOGLE_CLIENT_ID = '871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com';

export class ApiService {
  private static serverUrl: string = DEFAULT_SERVER_URL;
  private static token: string | null = null;
  private static user: { name: string; email: string; picture: string } | null = null;

  static async init(): Promise<void> {
    this.serverUrl = await AsyncStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL;
  }

  static getServerUrl(): string {
    return this.serverUrl;
  }

  static async setServerUrl(url: string): Promise<void> {
    this.serverUrl = url;
    await AsyncStorage.setItem(SERVER_URL_KEY, url);
  }

  static getToken(): string | null {
    return this.token;
  }

  static getUser(): { name: string; email: string; picture: string } | null {
    return this.user;
  }

  static setToken(token: string | null): void {
    this.token = token;
  }

  static setUser(user: { name: string; email: string; picture: string } | null): void {
    this.user = user;
  }

  static async clearSession(): Promise<void> {
    this.token = null;
    this.user = null;
    await AsyncStorage.multiRemove(['token', 'user', 'userEmail']);
  }

  static async saveSession(token: string, user: { name: string; email: string; picture: string }): Promise<void> {
    this.token = token;
    this.user = user;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('userEmail', user.email);
  }

  static async restoreSession(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
        return true;
      }
    } catch (e) {
      console.log('Failed to restore session:', e);
    }
    return false;
  }

  static async loginWithGoogle(): Promise<AuthResponse> {
    const redirectUri = WebBrowser.maybeRedirectUri();
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline&prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success' || !result.url) {
      throw new Error('Authentication failed');
    }

    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('No authorization code received');
    }

    const response = await fetch(`${this.serverUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    await this.saveSession(data.token, data.user);
    return data;
  }

  static async processTranscript(imageBase64?: string): Promise<TranscriptResult> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const body: { image?: string } = {};
    if (imageBase64) {
      body.image = imageBase64;
    }

    const response = await fetch(`${this.serverUrl}/process-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process transcript');
    }

    return await response.json();
  }

  static async getHistory(): Promise<HistoryEntry[]> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.serverUrl}/api-history`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get history');
    }

    const data = await response.json();
    return data.history || [];
  }

  static async getCertificates(): Promise<Certificate[]> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.serverUrl}/certificates`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get certificates');
    }

    const data = await response.json();
    return data.certificates || [];
  }

  static async getCertificateFile(filename: string): Promise<Blob> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.serverUrl}/certificates/${filename}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get certificate');
    }

    return await response.blob();
  }

  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/test`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }
}