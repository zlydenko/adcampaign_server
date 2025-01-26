import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { from, Observable, map } from 'rxjs';

import { CampaignReport } from '../entities/campaign-report.entity';
import { EventName } from '../../fetch';

export interface PaginatedReports {
  data: CampaignReport[];
  total: number;
  page: number;
  limit: number;
}

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

  getReports(page = 1, limit = 10): Observable<PaginatedReports> {
    return from(
      this.campaignReportRepository
        .createQueryBuilder('report')
        .orderBy('report.event_time', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount()
    ).pipe(
      map(([data, total]) => ({
        data,
        total,
        page,
        limit
      }))
    );
  }

  getAggregatedReports(
    fromDate: string,
    toDate: string,
    eventName: EventName,
    page = 1,
    take = 10
  ): Observable<{ data: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * take;

    const query = this.campaignReportRepository
      .createQueryBuilder('report')
      .select([
        'report.ad_id',
        'DATE(report.event_time) as date',
        'COUNT(*) as count'
      ])
      .where('report.event_time >= :fromDate', { fromDate })
      .andWhere('report.event_time <= :toDate', { toDate })
      .andWhere('report.event_name = :eventName', { eventName })
      .groupBy('report.ad_id, DATE(report.event_time)')
      .orderBy('date', 'DESC')
      .addOrderBy('count', 'DESC')
      .skip(skip)
      .take(take);

    return from(
      Promise.all([
        query.getRawMany(),
        query.getCount()
      ])
    ).pipe(
      map(([data, total]) => ({
        data,
        total,
        page,
        limit: take
      }))
    );
  }
} 