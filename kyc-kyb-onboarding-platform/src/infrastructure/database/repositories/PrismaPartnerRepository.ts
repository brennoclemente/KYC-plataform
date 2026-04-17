import { Partner } from '../../../domain/entities/Partner';
import { CreatePartnerData, IPartnerRepository } from '../../../domain/repositories/IPartnerRepository';
import { prisma } from '../prisma-client';

export class PrismaPartnerRepository implements IPartnerRepository {
  async create(data: CreatePartnerData): Promise<Partner> {
    const partner = await prisma.partner.create({ data });
    return partner as Partner;
  }

  async findById(id: string): Promise<Partner | null> {
    const partner = await prisma.partner.findUnique({ where: { id } });
    return partner as Partner | null;
  }

  async findByCompanyId(companyId: string): Promise<Partner[]> {
    const partners = await prisma.partner.findMany({ where: { companyId } });
    return partners as Partner[];
  }
}
