import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../infrastructure/auth/nextauth.config';
import { PrismaUserRepository } from '../../../../infrastructure/database/repositories/PrismaUserRepository';

const userRepository = new PrismaUserRepository();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const users = await userRepository.listAll();
  // Never expose passwordHash
  const safe = users.map(({ passwordHash: _, ...u }) => u);
  return NextResponse.json(safe);
}
