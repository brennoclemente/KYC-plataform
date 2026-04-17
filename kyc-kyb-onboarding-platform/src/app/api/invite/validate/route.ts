import { NextRequest, NextResponse } from 'next/server';
import { PrismaInviteCodeRepository } from '../../../../infrastructure/database/repositories/PrismaInviteCodeRepository';
import { ValidateInviteCodeUseCase } from '../../../../application/use-cases/invite/ValidateInviteCodeUseCase';

const inviteCodeRepository = new PrismaInviteCodeRepository();
const validateInviteCodeUseCase = new ValidateInviteCodeUseCase(inviteCodeRepository);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'O campo "code" é obrigatório.' },
        { status: 400 }
      );
    }

    const result = await validateInviteCodeUseCase.execute({ code });

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ valid: true, inviteCode: result.inviteCode }, { status: 200 });
  } catch (error) {
    console.error('Validate invite code error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
