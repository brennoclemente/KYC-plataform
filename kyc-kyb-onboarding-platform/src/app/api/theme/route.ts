import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../infrastructure/auth/nextauth.config';
import { PrismaThemeConfigRepository } from '../../../infrastructure/database/repositories/PrismaThemeConfigRepository';
import { GetThemeConfigUseCase } from '../../../application/use-cases/theme/GetThemeConfigUseCase';

const repository = new PrismaThemeConfigRepository();

export async function GET() {
  const useCase = new GetThemeConfigUseCase(repository);
  const theme = await useCase.execute();
  return NextResponse.json(theme, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });

  const theme = await repository.upsertActive(body);
  return NextResponse.json(theme, { status: 200 });
}
