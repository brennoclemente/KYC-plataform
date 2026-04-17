import { describe, it, expect, vi } from 'vitest';
import { GenerateInviteCodeUseCase } from '../GenerateInviteCodeUseCase';
import { IInviteCodeRepository } from '../../../../domain/repositories/IInviteCodeRepository';
import { InviteCode } from '../../../../domain/entities/InviteCode';

function makeRepo(overrides: Partial<IInviteCodeRepository> = {}): IInviteCodeRepository {
  return {
    findByCode: vi.fn(),
    create: vi.fn(),
    markAsUsed: vi.fn(),
    listAll: vi.fn(),
    ...overrides,
  };
}

function makeInviteCode(overrides: Partial<InviteCode> = {}): InviteCode {
  return {
    id: 'invite-1',
    code: 'ABC12345',
    email: null,
    isUsed: false,
    usedByUserId: null,
    createdByAdminId: 'admin-1',
    createdAt: new Date(),
    usedAt: null,
    ...overrides,
  };
}

describe('GenerateInviteCodeUseCase', () => {
  it('creates an invite code with the given adminId', async () => {
    const created = makeInviteCode();
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(created) });
    const useCase = new GenerateInviteCodeUseCase(repo);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(repo.create).toHaveBeenCalledOnce();
    const callArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.createdByAdminId).toBe('admin-1');
    expect(result).toBe(created);
  });

  it('generates an 8-character uppercase alphanumeric code', async () => {
    const repo = makeRepo({
      create: vi.fn().mockImplementation(async (data) =>
        makeInviteCode({ code: data.code })
      ),
    });
    const useCase = new GenerateInviteCodeUseCase(repo);

    await useCase.execute({ adminId: 'admin-1' });

    const callArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('passes email when provided', async () => {
    const created = makeInviteCode({ email: 'user@example.com' });
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(created) });
    const useCase = new GenerateInviteCodeUseCase(repo);

    await useCase.execute({ adminId: 'admin-1', email: 'user@example.com' });

    const callArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.email).toBe('user@example.com');
  });

  it('passes null email when not provided', async () => {
    const created = makeInviteCode();
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(created) });
    const useCase = new GenerateInviteCodeUseCase(repo);

    await useCase.execute({ adminId: 'admin-1' });

    const callArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.email).toBeNull();
  });
});
