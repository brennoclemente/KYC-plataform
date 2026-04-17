import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaUserRepository } from '../../../../infrastructure/database/repositories/PrismaUserRepository';
import { PrismaInviteCodeRepository } from '../../../../infrastructure/database/repositories/PrismaInviteCodeRepository';

const userRepository = new PrismaUserRepository();
const inviteCodeRepository = new PrismaInviteCodeRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, inviteCode } = body;

    if (!email || !password || !inviteCode) {
      return NextResponse.json(
        { error: 'Email, senha e código de convite são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validate invite code
    const invite = await inviteCodeRepository.findByCode(inviteCode);

    if (!invite) {
      return NextResponse.json(
        { error: 'Código de convite inválido.' },
        { status: 400 }
      );
    }

    if (invite.isUsed) {
      return NextResponse.json(
        { error: 'Este código de convite já foi utilizado.' },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({
      email,
      passwordHash,
      role: 'USER',
      inviteCodeId: invite.id,
    });

    // Mark invite code as used
    await inviteCodeRepository.markAsUsed(invite.id, user.id);

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
