import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../infrastructure/auth/nextauth.config';
import { CPFValidator } from '../../../../infrastructure/validators/CPFValidator';
import { S3StorageService } from '../../../../infrastructure/storage/S3StorageService';
import { PrismaPartnerRepository } from '../../../../infrastructure/database/repositories/PrismaPartnerRepository';
import { PrismaDocumentRepository } from '../../../../infrastructure/database/repositories/PrismaDocumentRepository';
import { PrismaCompanyRepository } from '../../../../infrastructure/database/repositories/PrismaCompanyRepository';
import { SubmitKYCPartnerUseCase } from '../../../../application/use-cases/kyc/SubmitKYCPartnerUseCase';
import { KYCDocumentInput, KYCDocumentType } from '../../../../application/dtos/KYCPartnerDTO';

const FILE_FIELD_MAP: Record<string, KYCDocumentType> = {
  rgFrente: 'RG_FRENTE',
  rgVerso: 'RG_VERSO',
  cnhFrente: 'CNH_FRENTE',
  cnhVerso: 'CNH_VERSO',
  selfie: 'SELFIE',
  comprovanteResidencia: 'COMPROVANTE_RESIDENCIA',
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const formData = await request.formData();

    const companyId = formData.get('companyId') as string | null;
    const nomeCompleto = formData.get('nomeCompleto') as string | null;
    const cpf = formData.get('cpf') as string | null;
    const dataNascimentoRaw = formData.get('dataNascimento') as string | null;
    const cargo = formData.get('cargo') as string | null;
    const isLastPartnerRaw = formData.get('isLastPartner') as string | null;

    if (!companyId || !nomeCompleto || !cpf || !dataNascimentoRaw || !cargo || isLastPartnerRaw === null) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const dataNascimento = new Date(dataNascimentoRaw);
    if (isNaN(dataNascimento.getTime())) {
      return NextResponse.json({ error: 'dataNascimento deve ser uma data ISO válida.' }, { status: 400 });
    }

    const isLastPartner = isLastPartnerRaw === 'true';

    const documents: KYCDocumentInput[] = [];

    for (const [fieldName, documentType] of Object.entries(FILE_FIELD_MAP)) {
      const file = formData.get(fieldName) as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        documents.push({
          file: buffer,
          documentType,
          mimeType: file.type,
          originalName: file.name,
        });
      }
    }

    const cpfValidator = new CPFValidator();
    const storageService = new S3StorageService();
    const partnerRepository = new PrismaPartnerRepository();
    const documentRepository = new PrismaDocumentRepository();
    const companyRepository = new PrismaCompanyRepository();

    const submitKYCPartnerUseCase = new SubmitKYCPartnerUseCase(
      cpfValidator,
      storageService,
      partnerRepository,
      documentRepository,
      companyRepository,
    );

    const { partner } = await submitKYCPartnerUseCase.execute({
      companyId,
      nomeCompleto,
      cpf,
      dataNascimento,
      cargo,
      isLastPartner,
      documents,
    });

    return NextResponse.json({ id: partner.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';

    if (message === 'CPF inválido.') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.toLowerCase().includes('upload') || message.toLowerCase().includes('s3')) {
      return NextResponse.json({ error: `Falha no upload de documento: ${message}` }, { status: 500 });
    }

    console.error('KYC partner submit error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
