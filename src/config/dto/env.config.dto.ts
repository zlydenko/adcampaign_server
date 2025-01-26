import { Type } from 'class-transformer';
import { IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { ApiConfigDto } from './api.config.dto';
import { DbConfigDto } from './db.config.dto';

export class RequiredEnvironmentVariables {
    @IsNumber()
    port: number;
  
    @IsString()
    fetch_cron: string;
}

export class EnvironmentVariables extends RequiredEnvironmentVariables {
  @IsOptional()
  @ValidateNested()
  @Type(() => DbConfigDto)
  db?: DbConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApiConfigDto)
  api?: ApiConfigDto;
}