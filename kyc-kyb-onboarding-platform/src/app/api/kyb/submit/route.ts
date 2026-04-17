import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../infrastructure/auth/nextauth.config';
import { CNPJValidator } from '../../../../infrastructure/validators/CNPJValidator';
import { S3StorageService } from '../../../../infrastructure/storage/S3StorageService';
import { PrismaCompanyRepository } from '../../../../infrastructure/database/repositories/PrismaCompanyRepository';
import { PrismaDocumentRepository } from '../../../../infrastructure/database/repositories/PrismaDocumentRepository';
import { TextractOCRService } from '../../../../infrastructure/ocr/TextractOCRService';
import { SubmitKYBUseCase } from '../../../../application/use-cases/kyb/SubmitKYBUseCase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const formData = await request.formData();

    const cnpj = formData.get('cnpj') as string | null;
    const razaoSocial = formData.get('razaoSocial') as string | null;
    const nomeFantasia = formData.get('nomeFantasia') as string | null;
    const logradouro = formData.get('logradouro') as string | null;
    const numero = formData.get('numero') as string | null;
    const complemento = formData.get('complemento') as string | null;
    const bairro = formData.get('bairro') as string | null;
    const cidade = formData.get('cidade') as string | null;
    const estado = formData.get('estado') as string | null;
    const cep = formData.get('cep') as string | null;
    const faturamentoMensalEstimadoRaw = formData.get('faturamentoMensalEstimado') as string | null;

    const contratoSocial = formData.get('contratoSocial') as File | null;
    const cartaoCnpj = formData.get('cartaoCnpj') as File | null;

    if (
      !cnpj || !razaoSocial || !nomeFantasia || !logradouro || !numero ||
      !bairro || !cidade || !estado || !cep || !faturamentoMensalEstimadoRaw ||
      !contratoSocial || !cartaoCnpj
    ) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const faturamentoMensalEstimado = parseFloat(faturamentoMensalEstimadoRaw);
    if (isNaN(faturamentoMensalEstimado)) {
      return NextResponse.json({ error: 'faturamentoMensalEstimado deve ser um número válido.' }, { status: 400 });
    }

    const contratoSocialBuffer = Buffer.from(await contratoSocial.arrayBuffer());
    const cartaoCnpjBuffer = Buffer.from(await cartaoCnpj.arrayBuffer());

    const cnpjValidator = new CNPJValidator();
    const storageService = new S3StorageService();
    const companyRepository = new PrismaCompanyRepository();
    const documentRepository = new PrismaDocumentRepository();
    const ocrService = new TextractOCRService();

    const submitKYBUseCase = new SubmitKYBUseCase(
      cnpjValidator,
      storageService,
      companyRepository,
      documentRepository,
      ocrService,
    );

    const { company } = await submitKYBUseCase.execute({
      userId: session.user.id,
      cnpj,
      razaoSocial,
      nomeFantasia,
      logradouro,
      numero,
      complemento: complemento ?? undefined,
      bairro,
      cidade,
      estado,
      cep,
      faturamentoMensalEstimado,
      documents: [
        {
          file: contratoSocialBuffer,
          documentType: 'CONTRATO_SOCIAL',
          mimeType: contratoSocial.type,
          originalName: contratoSocial.name,
        },
        {
          file: cartaoCnpjBuffer,
          documentType: 'CARTAO_CNPJ',
          mimeType: cartaoCnpj.type,
          originalName: cartaoCnpj.name,
        },
      ],
    });

    return NextResponse.json({ id: company.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.';

    if (message === 'CNPJ inválido.') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.toLowerCase().includes('upload') || message.toLowerCase().includes('s3')) {
      return NextResponse.json({ error: `Falha no upload de documento: ${message}` }, { status: 500 });
    }

    console.error('KYB submit error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
