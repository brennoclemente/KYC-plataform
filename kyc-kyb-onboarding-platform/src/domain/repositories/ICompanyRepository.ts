import { Company, OnboardingStatus } from '../entities/Company';

export interface CreateCompanyData {
  userId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  faturamentoMensalEstimado: number;
}

export interface ICompanyRepository {
  create(data: CreateCompanyData): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findByUserId(userId: string): Promise<Company | null>;
  listAll(filter?: { status?: OnboardingStatus }): Promise<Company[]>;
  updateStatus(id: string, status: OnboardingStatus, adminId: string): Promise<Company>;
  delete(id: string): Promise<void>;
}
