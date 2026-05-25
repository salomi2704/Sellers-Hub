export interface RequestUser {
  sub: string;
  email: string;
  sellerId: string;
  storeId: string;
  role: 'OWNER' | 'MANAGER' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT' | 'ADMIN';
  permissions: string[];
  type: 'access' | 'refresh';
}
