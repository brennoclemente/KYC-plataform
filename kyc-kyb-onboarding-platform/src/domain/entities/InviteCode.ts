// src/domain/entities/InviteCode.ts
export interface InviteCode {
  id: string;
  code: string; // Unique alphanumeric code
  email: string | null; // Optional: tied to a specific email
  isUsed: boolean;
  usedByUserId: string | null;
  createdByAdminId: string;
  createdAt: Date;
  usedAt: Date | null;
}
