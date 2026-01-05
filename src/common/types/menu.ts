export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  children?: Array<MenuItem>;
}

export interface MenuConfig {
  menuType: string;
  groups: Array<MenuItem>;
}
