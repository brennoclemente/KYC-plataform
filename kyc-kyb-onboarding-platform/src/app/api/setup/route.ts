import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaUserRepository } from '../../../infrastructure/database/repositories/PrismaUserRepository';

const userRepository = new PrismaUserRepository();

/** Returns whether the platform still needs initial setup (no users exist). */
export async function GET() {
  const count = await userRepository.count();
  return NextResponse.json({ needsSetup: count === 0 });
}

/** Creates the first admin user. Only works when no users exist. */
export async function POST(request: NextRequest) {
  const count = await userRepository.count();

  if (count > 0) {
    return NextResponse.json(
      { error: 'Setup já foi concluído. Um administrador já existe.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { error: 'E-mail e senha são obrigatórios.' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'A senha deve ter pelo menos 8 caracteres.' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await userRepository.create({
    email,
    passwordHash,
    role: 'ADMIN',
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
