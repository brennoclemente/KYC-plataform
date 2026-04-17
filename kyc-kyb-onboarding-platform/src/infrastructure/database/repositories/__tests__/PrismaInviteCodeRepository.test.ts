import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaInviteCodeRepository } from '../PrismaInviteCodeRepository';

vi.mock('../../prisma-client', () => ({
  prisma: {
    inviteCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../prisma-client';

const mockInvite = {
  id: 'invite-1',
  code: 'ABC123',
  email: 'user@example.com',
  isUsed: false,
  usedByUserId: null,
  createdByAdminId: 'admin-1',
  createdAt: new Date('2024-01-01'),
  usedAt: null,
};

describe('PrismaInviteCodeRepository', () => {
  let repo: PrismaInviteCodeRepository;

  beforeEach(() => {
    repo = new PrismaInviteCodeRepository();
    vi.clearAllMocks();
  });

  describe('findByCode', () => {
    it('should return invite when found by code', async () => {
      vi.mocked(prisma.inviteCode.findUnique).mockResolvedValue(mockInvite);

      const result = await repo.findByCode('ABC123');

      expect(prisma.inviteCode.findUnique).toHaveBeenCalledWith({ where: { code: 'ABC123' } });
      expect(result).toEqual(mockInvite);
    });

    it('should return null when code not found', async () => {
      vi.mocked(prisma.inviteCode.findUnique).mockResolvedValue(null);

      const result = await repo.findByCode('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create an invite code and return it', async () => {
      vi.mocked(prisma.inviteCode.create).mockResolvedValue(mockInvite);

      const result = await repo.create({
        code: 'ABC123',
        email: 'user@example.com',
        createdByAdminId: 'admin-1',
      });

      expect(prisma.inviteCode.create).toHaveBeenCalledWith({
        data: {
          code: 'ABC123',
          email: 'user@example.com',
          createdByAdminId: 'admin-1',
        },
      });
      expect(result).toEqual(mockInvite);
    });

    it('should create invite without email', async () => {
      const inviteNoEmail = { ...mockInvite, email: null };
      vi.mocked(prisma.inviteCode.create).mockResolvedValue(inviteNoEmail);

      await repo.create({
        code: 'XYZ789',
        createdByAdminId: 'admin-1',
      });

      expect(prisma.inviteCode.create).toHaveBeenCalledWith({
        data: {
          code: 'XYZ789',
          email: null,
          createdByAdminId: 'admin-1',
        },
      });
    });
  });

  describe('markAsUsed', () => {
    it('should mark invite as used with userId and timestamp', async () => {
      const usedInvite = {
        ...mockInvite,
        isUsed: true,
        usedByUserId: 'user-1',
        usedAt: new Date('2024-02-01'),
      };
      vi.mocked(prisma.inviteCode.update).mockResolvedValue(usedInvite);

      await repo.markAsUsed('invite-1', 'user-1');

      expect(prisma.inviteCode.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: {
          isUsed: true,
          usedByUserId: 'user-1',
          usedAt: expect.any(Date),
        },
      });
    });
  });

  describe('listAll', () => {
    it('should return all invite codes', async () => {
      const invite2 = { ...mockInvite, id: 'invite-2', code: 'DEF456' };
      vi.mocked(prisma.inviteCode.findMany).mockResolvedValue([mockInvite, invite2]);

      const result = await repo.listAll();

      expect(prisma.inviteCode.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no invites exist', async () => {
      vi.mocked(prisma.inviteCode.findMany).mockResolvedValue([]);

      const result = await repo.listAll();

      expect(result).toEqual([]);
    });
  });
});
