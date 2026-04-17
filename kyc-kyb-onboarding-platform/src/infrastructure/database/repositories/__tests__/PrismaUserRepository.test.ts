import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaUserRepository } from '../PrismaUserRepository';

// Mock the prisma-client module
vi.mock('../../prisma-client', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../../prisma-client';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  role: 'USER' as const,
  inviteCodeId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('PrismaUserRepository', () => {
  let repo: PrismaUserRepository;

  beforeEach(() => {
    repo = new PrismaUserRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user and return it', async () => {
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

      const result = await repo.create({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          role: 'USER',
          inviteCodeId: null,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should use provided role and inviteCodeId', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const, inviteCodeId: 'invite-1' };
      vi.mocked(prisma.user.create).mockResolvedValue(adminUser);

      await repo.create({
        email: 'admin@example.com',
        passwordHash: 'hashed',
        role: 'ADMIN',
        inviteCodeId: 'invite-1',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'admin@example.com',
          passwordHash: 'hashed',
          role: 'ADMIN',
          inviteCodeId: 'invite-1',
        },
      });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await repo.findById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await repo.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await repo.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });
});
