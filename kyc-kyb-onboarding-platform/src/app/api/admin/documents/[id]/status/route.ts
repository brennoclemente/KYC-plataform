import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../../infrastructure/auth/nextauth.config';
import { prisma } from '../../../../../../infrastructure/database/prisma-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, rejectionReason } = body as { status?: string; rejectionReason?: string };

  if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido. Use APPROVED, REJECTED ou PENDING.' }, { status: 400 });
  }

  if (status === 'REJECTED' && !rejectionReason?.trim()) {
    return NextResponse.json({ error: 'Motivo da reprovação é obrigatório.' }, { status: 400 });
  }

  const doc = await prisma.document.update({
    where: { id },
    data: {
      documentStatus: status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
    },
  });

  return NextResponse.json(doc);
}
