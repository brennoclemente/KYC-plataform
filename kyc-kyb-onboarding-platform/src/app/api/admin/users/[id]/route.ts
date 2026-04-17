import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '../../../../../infrastructure/auth/nextauth.config';
import { PrismaUserRepository } from '../../../../../infrastructure/database/repositories/PrismaUserRepository';

const userRepository = new PrismaUserRepository();

// PATCH /api/admin/users/[id] — update email, role or password
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { email, role, password } = body as { email?: string; role?: string; password?: string };

  const updateData: Record<string, string> = {};
  if (email) updateData.email = email;
  if (role && ['USER', 'ADMIN'].includes(role)) updateData.role = role;
  if (password) {
    if (password.length < 8) return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres.' }, { status: 400 });
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
  }

  const user = await userRepository.update(id, updateData);
  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe);
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { id } = await params;

  // Prevent deleting yourself
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Não é possível excluir sua própria conta.' }, { status: 400 });
  }

  await userRepository.delete(id);
  return NextResponse.json({ success: true });
}
