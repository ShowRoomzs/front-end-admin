const STORAGE_KEY = "sidebar-menu-state";

interface MenuState {
  [menuId: string]: boolean;
}

export const menuStorage = {
  getAll: (): MenuState => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  },

  get: (menuId: string): boolean => {
    const state = menuStorage.getAll();
    return state[menuId] ?? false;
  },

  set: (menuId: string, isOpen: boolean): void => {
    const state = menuStorage.getAll();
    state[menuId] = isOpen;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
};
