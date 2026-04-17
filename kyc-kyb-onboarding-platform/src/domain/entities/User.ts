// src/domain/entities/User.ts
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  inviteCodeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
