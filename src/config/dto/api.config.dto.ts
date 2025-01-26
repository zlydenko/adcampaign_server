import { IsString } from 'class-validator';

export class ApiConfigDto {
  @IsString()
  url: string;

  @IsString()
  key: string;

  static isEmpty(config: Partial<ApiConfigDto>): boolean {
    return !config.url && !config.key;
  }

  static getMissingProperties(config: Partial<ApiConfigDto>): string[] {
    const missing: string[] = [];
    if (!config.url) missing.push('API_URL');
    if (!config.key) missing.push('API_KEY');
    return missing;
  }
} 