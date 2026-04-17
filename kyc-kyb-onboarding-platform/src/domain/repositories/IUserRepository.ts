import { User } from '../entities/User';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role?: 'USER' | 'ADMIN';
  inviteCodeId?: string | null;
}

export interface UpdateUserData {
  email?: string;
  role?: 'USER' | 'ADMIN';
  passwordHash?: string;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  listAll(): Promise<User[]>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
