import { InviteCode } from '../../../domain/entities/InviteCode';
import { CreateInviteCodeData, IInviteCodeRepository } from '../../../domain/repositories/IInviteCodeRepository';
import { prisma } from '../prisma-client';

export class PrismaInviteCodeRepository implements IInviteCodeRepository {
  async findByCode(code: string): Promise<InviteCode | null> {
    const invite = await prisma.inviteCode.findUnique({ where: { code } });
    return invite as InviteCode | null;
  }

  async create(data: CreateInviteCodeData): Promise<InviteCode> {
    const invite = await prisma.inviteCode.create({
      data: {
        code: data.code,
        email: data.email ?? null,
        createdByAdminId: data.createdByAdminId,
      },
    });
    return invite as InviteCode;
  }

  async markAsUsed(id: string, userId: string): Promise<void> {
    await prisma.inviteCode.update({
      where: { id },
      data: {
        isUsed: true,
        usedByUserId: userId,
        usedAt: new Date(),
      },
    });
  }

  async listAll(): Promise<InviteCode[]> {
    const invites = await prisma.inviteCode.findMany();
    return invites as InviteCode[];
  }
}
