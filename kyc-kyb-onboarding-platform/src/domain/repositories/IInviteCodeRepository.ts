import { InviteCode } from '../entities/InviteCode';

export interface CreateInviteCodeData {
  code: string;
  email?: string | null;
  createdByAdminId: string;
}

export interface IInviteCodeRepository {
  findByCode(code: string): Promise<InviteCode | null>;
  create(data: CreateInviteCodeData): Promise<InviteCode>;
  markAsUsed(id: string, userId: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  listAll(): Promise<InviteCode[]>;
}
