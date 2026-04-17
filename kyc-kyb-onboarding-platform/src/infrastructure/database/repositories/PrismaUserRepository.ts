import { User } from '../../../domain/entities/User';
import { CreateUserData, IUserRepository } from '../../../domain/repositories/IUserRepository';
import { prisma } from '../prisma-client';

export class PrismaUserRepository implements IUserRepository {
  async create(data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? 'USER',
        inviteCodeId: data.inviteCodeId ?? null,
      },
    });
    return user as User;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user as User | null;
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}
