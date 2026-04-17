import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../infrastructure/auth/nextauth.config';
import { PrismaCompanyRepository } from '../../../../../../infrastructure/database/repositories/PrismaCompanyRepository';
import { UpdateOnboardingStatusUseCase } from '../../../../../../application/use-cases/admin/UpdateOnboardingStatusUseCase';

const companyRepository = new PrismaCompanyRepository();
const updateOnboardingStatusUseCase = new UpdateOnboardingStatusUseCase(companyRepository);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { status } = body as { status?: string };

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use APPROVED ou REJECTED.' },
        { status: 400 }
      );
    }

    const company = await updateOnboardingStatusUseCase.execute({
      companyId: id,
      status: status as 'APPROVED' | 'REJECTED',
      adminId: session.user.id,
    });

    return NextResponse.json(company, { status: 200 });
  } catch (error) {
    console.error('Update onboarding status error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
