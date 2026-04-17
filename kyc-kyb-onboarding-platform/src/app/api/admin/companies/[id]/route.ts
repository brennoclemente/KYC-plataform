import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../infrastructure/auth/nextauth.config';
import { PrismaCompanyRepository } from '../../../../../infrastructure/database/repositories/PrismaCompanyRepository';
import { PrismaPartnerRepository } from '../../../../../infrastructure/database/repositories/PrismaPartnerRepository';
import { PrismaDocumentRepository } from '../../../../../infrastructure/database/repositories/PrismaDocumentRepository';
import { S3StorageService } from '../../../../../infrastructure/storage/S3StorageService';
import { Document } from '../../../../../domain/entities/Document';

const companyRepository = new PrismaCompanyRepository();
const partnerRepository = new PrismaPartnerRepository();
const documentRepository = new PrismaDocumentRepository();
const storageService = new S3StorageService();

async function attachPresignedUrl(doc: Document) {
  const presignedUrl = await storageService.generatePresignedUrl(doc.s3Key);
  return { ...doc, presignedUrl };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const { id } = await params;

    const company = await companyRepository.findById(id);
    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
    }

    const [partners, companyDocs] = await Promise.all([
      partnerRepository.findByCompanyId(id),
      documentRepository.findByCompanyId(id),
    ]);

    const companyDocuments = await Promise.all(companyDocs.map(attachPresignedUrl));

    const partnersWithDocuments = await Promise.all(
      partners.map(async (partner) => {
        const partnerDocs = await documentRepository.findByPartnerId(partner.id);
        const documents = await Promise.all(partnerDocs.map(attachPresignedUrl));
        return { ...partner, documents };
      })
    );

    return NextResponse.json(
      { company, partners: partnersWithDocuments, companyDocuments },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get company detail error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
