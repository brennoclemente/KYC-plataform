import { Company, OnboardingStatus } from '../../../domain/entities/Company';
import { ICompanyRepository } from '../../../domain/repositories/ICompanyRepository';

export interface ListCompaniesInput {
  status?: OnboardingStatus;
}

export class ListCompaniesUseCase {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute(input: ListCompaniesInput = {}): Promise<Company[]> {
    if (input.status !== undefined) {
      return this.companyRepository.listAll({ status: input.status });
    }
    return this.companyRepository.listAll();
  }
}
