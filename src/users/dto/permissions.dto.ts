export interface MenuPermission {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

export interface PermissionsResponse {
  role: string;
  permissions: string[];
  menu: MenuPermission[];
}
