import { describe, it, expect, vi } from 'vitest';
import { ValidateInviteCodeUseCase } from '../ValidateInviteCodeUseCase';
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

describe('ValidateInviteCodeUseCase', () => {
  it('returns valid result when code exists and is not used', async () => {
    const inviteCode = makeInviteCode();
    const repo = makeRepo({ findByCode: vi.fn().mockResolvedValue(inviteCode) });
    const useCase = new ValidateInviteCodeUseCase(repo);

    const result = await useCase.execute({ code: 'ABC12345' });

    expect(result).toEqual({ valid: true, inviteCode });
  });

  it('returns error when code does not exist', async () => {
    const repo = makeRepo({ findByCode: vi.fn().mockResolvedValue(null) });
    const useCase = new ValidateInviteCodeUseCase(repo);

    const result = await useCase.execute({ code: 'NOTFOUND' });

    expect(result).toEqual({ valid: false, error: 'Código de convite inválido.' });
  });

  it('returns error when code has already been used', async () => {
    const inviteCode = makeInviteCode({ isUsed: true, usedByUserId: 'user-1', usedAt: new Date() });
    const repo = makeRepo({ findByCode: vi.fn().mockResolvedValue(inviteCode) });
    const useCase = new ValidateInviteCodeUseCase(repo);

    const result = await useCase.execute({ code: 'ABC12345' });

    expect(result).toEqual({ valid: false, error: 'Este código de convite já foi utilizado.' });
  });

  it('calls repository with the provided code', async () => {
    const repo = makeRepo({ findByCode: vi.fn().mockResolvedValue(null) });
    const useCase = new ValidateInviteCodeUseCase(repo);

    await useCase.execute({ code: 'XYZ99999' });

    expect(repo.findByCode).toHaveBeenCalledWith('XYZ99999');
  });
});
