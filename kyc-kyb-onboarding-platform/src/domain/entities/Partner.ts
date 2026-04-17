// src/domain/entities/Partner.ts
export interface Partner {
  id: string;
  companyId: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: Date;
  cargo: string;
  createdAt: Date;
  updatedAt: Date;
}
