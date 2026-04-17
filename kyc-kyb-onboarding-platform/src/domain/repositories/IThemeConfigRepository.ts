import { ThemeConfig } from '../entities/ThemeConfig';
import { ThemeConfigDTO } from '../../application/dtos/ThemeConfigDTO';

export interface IThemeConfigRepository {
  findActive(): Promise<ThemeConfig | null>;
  findByTenantId(tenantId: string): Promise<ThemeConfig | null>;
  upsertActive(data: Omit<ThemeConfigDTO, never> & { tenantId?: string }): Promise<ThemeConfig>;
}
