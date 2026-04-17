import { InviteCode } from '../../../domain/entities/InviteCode';
import { IInviteCodeRepository } from '../../../domain/repositories/IInviteCodeRepository';

export interface GenerateInviteCodeInput {
  adminId: string;
  email?: string;
}

export class GenerateInviteCodeUseCase {
  constructor(private readonly inviteCodeRepository: IInviteCodeRepository) {}

  async execute(input: GenerateInviteCodeInput): Promise<InviteCode> {
    const code = this.generateCode();

    return this.inviteCodeRepository.create({
      code,
      email: input.email ?? null,
      createdByAdminId: input.adminId,
    });
  }

  private generateCode(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
