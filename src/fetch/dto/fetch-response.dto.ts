import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ErrorDetailsDto {
  @IsNumber()
  code: number;

  @IsString()
  message: string;
}

export class PaginationDto {
  @IsString()
  next: string;
}

export class FetchSuccessDataDto {
  @IsString()
  csv: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}

export class FetchSuccessDto {
  @IsNumber()
  timestamp: number;

  @ValidateNested()
  @Type(() => FetchSuccessDataDto)
  data: FetchSuccessDataDto;
}

export class FetchErrorDto {
  @IsNumber()
  timestamp: number;

  @ValidateNested()
  @Type(() => ErrorDetailsDto)
  error: ErrorDetailsDto;
}

export type FetchResponseDto = FetchSuccessDto | FetchErrorDto;

export const isFetchSuccess = (response: FetchResponseDto): response is FetchSuccessDto => 
  'data' in response;

export const isFetchError = (response: FetchResponseDto): response is FetchErrorDto => 
  'error' in response; 