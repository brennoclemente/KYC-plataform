import { User } from '../entities/User';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role?: 'USER' | 'ADMIN';
  inviteCodeId?: string | null;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  count(): Promise<number>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
