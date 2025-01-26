import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ApiConfigDto } from './api.config.dto';
import { DbConfigDto } from './db.config.dto';

export class EnvironmentVariables {
  @IsNumber()
  port: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DbConfigDto)
  db?: DbConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApiConfigDto)
  api?: ApiConfigDto;
} 