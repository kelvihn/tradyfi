// Global authentication state to prevent infinite loops
class AuthState {
  private hasToken: boolean = false;
  private initialized: boolean = false;
  private listeners: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.hasToken = !!localStorage.getItem('token');
      this.initialized = true;
    }
  }

  getHasToken(): boolean {
    if (!this.initialized && typeof window !== 'undefined') {
      this.hasToken = !!localStorage.getItem('token');
      this.initialized = true;
    }
    return this.hasToken;
  }

  setHasToken(value: boolean): void {
    this.hasToken = value;
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const authState = new AuthState();