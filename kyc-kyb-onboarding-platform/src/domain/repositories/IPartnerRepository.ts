import { Partner } from '../entities/Partner';

export interface CreatePartnerData {
  companyId: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: Date;
  cargo: string;
}

export interface IPartnerRepository {
  create(data: CreatePartnerData): Promise<Partner>;
  findById(id: string): Promise<Partner | null>;
  findByCompanyId(companyId: string): Promise<Partner[]>;
}
