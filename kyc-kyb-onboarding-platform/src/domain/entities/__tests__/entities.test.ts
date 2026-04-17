import { describe, it, expect } from 'vitest';
import type { User } from '../User';
import type { Company, OnboardingStatus } from '../Company';
import type { Document, DocumentType, OcrField, OcrStatus } from '../Document';

// Helper that enforces the lowConfidence business rule (confidence < 0.80)
function createOcrField(value: string, confidence: number): OcrField {
  return { value, confidence, lowConfidence: confidence < 0.80 };
}

describe('User entity', () => {
  it('can be constructed with all required fields', () => {
    const user: User = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      role: 'USER',
      inviteCodeId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('USER');
    expect(user.inviteCodeId).toBeNull();
  });

  it('accepts ADMIN role', () => {
    const admin: User = {
      id: 'admin-1',
      email: 'admin@example.com',
      passwordHash: 'hashed-password',
      role: 'ADMIN',
      inviteCodeId: 'invite-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(admin.role).toBe('ADMIN');
    expect(admin.inviteCodeId).toBe('invite-1');
  });
});

describe('Company entity', () => {
  it('can be constructed with all required fields', () => {
    const company: Company = {
      id: 'company-1',
      userId: 'user-1',
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'Empresa Teste LTDA',
      nomeFantasia: 'Empresa Teste',
      logradouro: 'Rua das Flores',
      numero: '123',
      complemento: null,
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      faturamentoMensalEstimado: 50000,
      onboardingStatus: 'PENDING',
      reviewedByAdminId: null,
      reviewedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    expect(company.id).toBe('company-1');
    expect(company.cnpj).toBe('12.345.678/0001-90');
    expect(company.onboardingStatus).toBe('PENDING');
  });

  it('accepts all OnboardingStatus values', () => {
    const statuses: OnboardingStatus[] = ['PENDING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];

    statuses.forEach((status) => {
      const company: Company = {
        id: 'company-1',
        userId: 'user-1',
        cnpj: '12.345.678/0001-90',
        razaoSocial: 'Empresa Teste LTDA',
        nomeFantasia: 'Empresa Teste',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: null,
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
        faturamentoMensalEstimado: 50000,
        onboardingStatus: status,
        reviewedByAdminId: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(company.onboardingStatus).toBe(status);
    });
  });
});

describe('Document entity', () => {
  it('can be constructed with all required fields', () => {
    const doc: Document = {
      id: 'doc-1',
      companyId: 'company-1',
      partnerId: null,
      documentType: 'CONTRATO_SOCIAL',
      s3Key: 'uploads/company-1/contrato.pdf',
      mimeType: 'application/pdf',
      ocrStatus: 'PENDING',
      ocrRawText: null,
      ocrStructuredData: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    expect(doc.id).toBe('doc-1');
    expect(doc.documentType).toBe('CONTRATO_SOCIAL');
    expect(doc.ocrStatus).toBe('PENDING');
    expect(doc.ocrStructuredData).toBeNull();
  });

  it('accepts all DocumentType values', () => {
    const types: DocumentType[] = [
      'CONTRATO_SOCIAL',
      'CARTAO_CNPJ',
      'RG_FRENTE',
      'RG_VERSO',
      'CNH_FRENTE',
      'CNH_VERSO',
      'SELFIE',
      'COMPROVANTE_RESIDENCIA',
    ];

    types.forEach((documentType) => {
      const doc: Document = {
        id: 'doc-1',
        companyId: null,
        partnerId: 'partner-1',
        documentType,
        s3Key: `uploads/${documentType}.jpg`,
        mimeType: 'image/jpeg',
        ocrStatus: 'COMPLETED',
        ocrRawText: null,
        ocrStructuredData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(doc.documentType).toBe(documentType);
    });
  });

  it('accepts all OcrStatus values', () => {
    const statuses: OcrStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

    statuses.forEach((ocrStatus) => {
      const doc: Document = {
        id: 'doc-1',
        companyId: 'company-1',
        partnerId: null,
        documentType: 'SELFIE',
        s3Key: 'uploads/selfie.jpg',
        mimeType: 'image/jpeg',
        ocrStatus,
        ocrRawText: null,
        ocrStructuredData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(doc.ocrStatus).toBe(ocrStatus);
    });
  });
});

describe('OcrField — createOcrField helper', () => {
  it('sets lowConfidence to true when confidence is 0.79', () => {
    const field = createOcrField('João Silva', 0.79);
    expect(field.lowConfidence).toBe(true);
  });

  it('sets lowConfidence to false when confidence is exactly 0.80', () => {
    const field = createOcrField('João Silva', 0.80);
    expect(field.lowConfidence).toBe(false);
  });

  it('sets lowConfidence to false when confidence is 0.95', () => {
    const field = createOcrField('João Silva', 0.95);
    expect(field.lowConfidence).toBe(false);
  });

  it('sets lowConfidence to true when confidence is 0.0', () => {
    const field = createOcrField('', 0.0);
    expect(field.lowConfidence).toBe(true);
  });

  it('preserves value and confidence on the returned object', () => {
    const field = createOcrField('12.345.678/0001-90', 0.92);
    expect(field.value).toBe('12.345.678/0001-90');
    expect(field.confidence).toBe(0.92);
  });
});
