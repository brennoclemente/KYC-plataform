// src/domain/entities/Company.ts
export type OnboardingStatus = 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Company {
  id: string;
  userId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  faturamentoMensalEstimado: number;
  onboardingStatus: OnboardingStatus;
  reviewedByAdminId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
