import { Company, OnboardingStatus } from '../../../domain/entities/Company';
import { CreateCompanyData, ICompanyRepository } from '../../../domain/repositories/ICompanyRepository';
import { prisma } from '../prisma-client';

export class PrismaCompanyRepository implements ICompanyRepository {
  async create(data: CreateCompanyData): Promise<Company> {
    const company = await prisma.company.create({ data });
    return company as Company;
  }

  async findById(id: string): Promise<Company | null> {
    const company = await prisma.company.findUnique({ where: { id } });
    return company as Company | null;
  }

  async findByUserId(userId: string): Promise<Company | null> {
    const company = await prisma.company.findUnique({ where: { userId } });
    return company as Company | null;
  }

  async listAll(filter?: { status?: OnboardingStatus }): Promise<Company[]> {
    const companies = await prisma.company.findMany({
      where: filter?.status ? { onboardingStatus: filter.status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return companies as Company[];
  }

  async updateStatus(id: string, status: OnboardingStatus, adminId: string): Promise<Company> {
    const company = await prisma.company.update({
      where: { id },
      data: { onboardingStatus: status, reviewedByAdminId: adminId, reviewedAt: new Date() },
    });
    return company as Company;
  }

  async delete(id: string): Promise<void> {
    // Cascade: delete documents → partners → company
    const partners = await prisma.partner.findMany({ where: { companyId: id } });
    for (const partner of partners) {
      await prisma.document.deleteMany({ where: { partnerId: partner.id } });
    }
    await prisma.document.deleteMany({ where: { companyId: id } });
    await prisma.partner.deleteMany({ where: { companyId: id } });
    await prisma.company.delete({ where: { id } });
  }
}
