export type UserRole = 'OWNER' | 'STAFF' | 'VENDOR' | 'CLIENT';

export interface JwtUser {
  userId: string;
  orgId: string;
  role: UserRole;
  email?: string;
  name?: string;
}
