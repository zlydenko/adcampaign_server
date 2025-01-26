import { IsOptional, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EventName } from '../../fetch';

import { CampaignReport } from '../../database';

export class PaginationQueryDto {
  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, minimum: 1, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number;
}

export class PaginatedCampaignReportsDto {
  @ApiProperty({ type: [CampaignReport] })
  data: CampaignReport[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class AggregatedQueryDto {
  @ApiProperty({ 
    required: true,
    example: 'YYYY-MM-DD HH:00:00',
    description: 'Start date in format YYYY-MM-DD HH:00:00'
  })
  @IsDateString()
  from_date: string;

  @ApiProperty({ 
    required: true,
    example: 'YYYY-MM-DD HH:00:00',
    description: 'End date in format YYYY-MM-DD HH:00:00'
  })
  @IsDateString()
  to_date: string;

  @ApiProperty({ 
    enum: EventName, 
    required: true,
    example: 'purchase'
  })
  @IsEnum(EventName)
  event_name: EventName;

  @ApiProperty({ 
    required: false, 
    minimum: 1, 
    default: 10,
    description: 'Number of records per page'
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  take?: number;

  @ApiProperty({ 
    required: false, 
    minimum: 1, 
    default: 1,
    description: 'Page number'
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;
}

export class AggregatedReportDto {
  @ApiProperty()
  ad_id: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  count: number;
}

export class PaginatedAggregatedReportsDto {
  @ApiProperty({ type: [AggregatedReportDto] })
  data: AggregatedReportDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
} 