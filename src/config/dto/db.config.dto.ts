import { IsNumber, IsString } from 'class-validator';

export class DbConfigDto {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  user: string;

  @IsString()
  pass: string;

  static isEmpty(config: Partial<DbConfigDto>): boolean {
    return !config.host && !config.port && !config.user && !config.pass;
  }

  static getMissingProperties(config: Partial<DbConfigDto>): string[] {
    const missing: string[] = [];
    if (!config.host) missing.push('DB_HOST');
    if (!config.port) missing.push('DB_PORT');
    if (!config.user) missing.push('DB_USER');
    if (!config.pass) missing.push('DB_PASS');
    return missing;
  }
} 