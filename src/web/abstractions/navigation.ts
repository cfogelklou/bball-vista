/**
 * Web Navigation Abstraction
 * Provides React Navigation-like API for PWA using simple state management
 */

export interface NavigationProp {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  canGoBack: () => boolean;
}

export interface NavigationState {
  currentScreen: string;
  params?: any;
  history: Array<{ screen: string; params?: any }>;
}

// Simple navigation state manager for PWA
class WebNavigationManager {
  private listeners: Array<(state: NavigationState) => void> = [];
  private state: NavigationState = {
    currentScreen: 'Launch',
    history: [{ screen: 'Launch' }],
  };

  subscribe(listener: (state: NavigationState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  navigate(screen: string, params?: any) {
    this.state = {
      currentScreen: screen,
      params,
      history: [...this.state.history, { screen, params }],
    };
    this.notifyListeners();
  }

  goBack() {
    if (this.state.history.length > 1) {
      const newHistory = this.state.history.slice(0, -1);
      const previous = newHistory[newHistory.length - 1];
      this.state = {
        currentScreen: previous.screen,
        params: previous.params,
        history: newHistory,
      };
      this.notifyListeners();
    }
  }

  canGoBack() {
    return this.state.history.length > 1;
  }

  getCurrentState() {
    return this.state;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const navigationManager = new WebNavigationManager();

// Hook to use navigation (similar to useNavigation from React Navigation)
export function useNavigation(): NavigationProp {
  return {
    navigate: navigationManager.navigate.bind(navigationManager),
    goBack: navigationManager.goBack.bind(navigationManager),
    canGoBack: navigationManager.canGoBack.bind(navigationManager),
  };
}