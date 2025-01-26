import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { CampaignReportService } from '../../database';
import {
  PaginatedCampaignReportsDto,
  PaginationQueryDto,
  AggregatedQueryDto,
  PaginatedAggregatedReportsDto
} from '../dto/campaign-reports.dto';

@ApiTags('Campaign Reports')
@Controller({
  path: 'campaign-reports',
  version: '1'
})
export class CampaignReportsController {
  constructor(private campaignReportService: CampaignReportService) {}

//   @Get()
//   @UsePipes(new ValidationPipe({ transform: true }))
//   @ApiOperation({ summary: 'Get paginated campaign reports' })
//   @ApiResponse({
//     status: 200,
//     description: 'Returns paginated campaign reports',
//     type: PaginatedCampaignReportsDto
//   })
//   getReports(
//     @Query() query: PaginationQueryDto
//   ): Observable<PaginatedCampaignReportsDto> {
//     const page = query.page || 1;
//     const limit = query.limit || 10;

//     return this.campaignReportService.getReports(page, limit);
//   }

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
} 