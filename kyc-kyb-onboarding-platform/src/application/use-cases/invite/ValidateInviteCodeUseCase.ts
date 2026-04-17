import { InviteCode } from '../../../domain/entities/InviteCode';
import { IInviteCodeRepository } from '../../../domain/repositories/IInviteCodeRepository';

export interface ValidateInviteCodeInput {
  code: string;
}

export type ValidateInviteCodeResult =
  | { valid: true; inviteCode: InviteCode }
  | { valid: false; error: string };

export class ValidateInviteCodeUseCase {
  constructor(private readonly inviteCodeRepository: IInviteCodeRepository) {}

  async execute(input: ValidateInviteCodeInput): Promise<ValidateInviteCodeResult> {
    const inviteCode = await this.inviteCodeRepository.findByCode(input.code);

    if (!inviteCode) {
      return { valid: false, error: 'Código de convite inválido.' };
    }

    if (inviteCode.isUsed) {
      return { valid: false, error: 'Este código de convite já foi utilizado.' };
    }

    return { valid: true, inviteCode };
  }
}
