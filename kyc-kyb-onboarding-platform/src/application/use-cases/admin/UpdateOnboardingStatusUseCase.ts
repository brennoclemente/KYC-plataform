import { Company } from '../../../domain/entities/Company';
import { ICompanyRepository } from '../../../domain/repositories/ICompanyRepository';

export interface UpdateOnboardingStatusInput {
  companyId: string;
  status: 'APPROVED' | 'REJECTED';
  adminId: string;
}

export class UpdateOnboardingStatusUseCase {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute(input: UpdateOnboardingStatusInput): Promise<Company> {
    return this.companyRepository.updateStatus(input.companyId, input.status, input.adminId);
  }
}
