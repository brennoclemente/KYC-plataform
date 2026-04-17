import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../infrastructure/auth/nextauth.config';
import { PrismaInviteCodeRepository } from '../../../../infrastructure/database/repositories/PrismaInviteCodeRepository';

const inviteCodeRepository = new PrismaInviteCodeRepository();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem listar convites.' }, { status: 403 });
    }

    const inviteCodes = await inviteCodeRepository.listAll();

    return NextResponse.json(inviteCodes, { status: 200 });
  } catch (error) {
    console.error('List invite codes error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
