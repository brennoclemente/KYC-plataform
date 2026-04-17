import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../infrastructure/auth/nextauth.config';
import { PrismaInviteCodeRepository } from '../../../../infrastructure/database/repositories/PrismaInviteCodeRepository';
import { GenerateInviteCodeUseCase } from '../../../../application/use-cases/invite/GenerateInviteCodeUseCase';

const inviteCodeRepository = new PrismaInviteCodeRepository();
const generateInviteCodeUseCase = new GenerateInviteCodeUseCase(inviteCodeRepository);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem gerar convites.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { email } = body as { adminId?: string; email?: string };

    const inviteCode = await generateInviteCodeUseCase.execute({
      adminId: session.user.id,
      email: email ?? undefined,
    });

    return NextResponse.json(inviteCode, { status: 201 });
  } catch (error) {
    console.error('Generate invite code error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
