import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, Observable, map } from 'rxjs';

import { CampaignReport } from '../entities/campaign-report.entity';

@Injectable()
export class CampaignReportService {
  constructor(
    @InjectRepository(CampaignReport)
    private campaignReportRepository: Repository<CampaignReport>
  ) {}

  saveReports(reports: Omit<CampaignReport, 'id'>[]): Observable<void> {
    return from(
      this.campaignReportRepository
        .createQueryBuilder()
        .insert()
        .into(CampaignReport)
        .values(reports)
        .orIgnore()
        .execute()
    ).pipe(
      map(() => void 0)
    );
  }
} 