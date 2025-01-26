import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, Observable } from 'rxjs';

import { Storage } from '../storage';
import { CampaignEvent } from '../../fetch';
import { CampaignReport } from '../entities';

@Injectable()
export class PostgresStorage extends Storage<CampaignEvent> {
  constructor(
    @InjectRepository(CampaignReport)
    private campaignReportRepository: Repository<CampaignReport>
  ) {
    super();
  }

  save(reports: CampaignEvent[]): Observable<void> {
    return from(
      this.campaignReportRepository
        .createQueryBuilder()
        .insert()
        .into(CampaignReport)
        .values(reports)
        .orIgnore()
        .execute()
    );
  }
} 