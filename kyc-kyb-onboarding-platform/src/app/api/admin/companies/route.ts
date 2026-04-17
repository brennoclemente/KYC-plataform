import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../infrastructure/auth/nextauth.config';
import { PrismaCompanyRepository } from '../../../../infrastructure/database/repositories/PrismaCompanyRepository';
import { ListCompaniesUseCase } from '../../../../application/use-cases/admin/ListCompaniesUseCase';
import { OnboardingStatus } from '../../../../domain/entities/Company';

const companyRepository = new PrismaCompanyRepository();
const listCompaniesUseCase = new ListCompaniesUseCase(companyRepository);

const VALID_STATUSES: OnboardingStatus[] = ['PENDING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    let status: OnboardingStatus | undefined;
    if (statusParam) {
      if (!VALID_STATUSES.includes(statusParam as OnboardingStatus)) {
        return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
      }
      status = statusParam as OnboardingStatus;
    }

    const companies = await listCompaniesUseCase.execute({ status });

    return NextResponse.json(companies, { status: 200 });
  } catch (error) {
    console.error('List companies error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
