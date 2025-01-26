import { Controller, Get, Query, UsePipes, ValidationPipe, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { CampaignReportService } from '../../database';
import { CampaignEvent, DataFetcher } from '../../fetch';
import {
  AggregatedQueryDto,
  PaginatedAggregatedReportsDto,
  FetchQueryDto
} from '../dto/campaign-reports.dto';

@ApiTags('Campaign Reports')
@Controller({
  path: 'campaign-reports',
  version: '1'
})
export class CampaignReportsController {
  constructor(
    private campaignReportService: CampaignReportService,
    private dataFetcher: DataFetcher<CampaignEvent>
  ) {}

  @Get('aggregated')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Get aggregated campaign reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns aggregated campaign reports by ad_id and date',
    type: PaginatedAggregatedReportsDto
  })
  getAggregatedReports(
    @Query() query: AggregatedQueryDto
  ): Observable<PaginatedAggregatedReportsDto> {
    const { from_date, to_date, event_name, take = 10, page = 1 } = query;
    
    return this.campaignReportService.getAggregatedReports(
      from_date,
      to_date,
      event_name,
      page,
      take
    );
  }

  @Post('fetch')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Initiate data fetch for date range' })
  @ApiResponse({
    status: 200,
    description: 'Fetch initiated successfully'
  })
  fetchData(@Query() query: FetchQueryDto): Observable<void> {
    const { from_date, to_date } = query;
    return this.dataFetcher.fetchDateRange(from_date, to_date);
  }
} 