import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { Observable, from, map, Subject, firstValueFrom } from 'rxjs';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { DataFetcher, FetchResult } from '../fetcher';
import { CampaignEvent, CampaignEventDto, EventName } from '../dto';

@Injectable()
export class FileFetcher extends DataFetcher<CampaignEvent> {
  private isRunning = false;
  private result$ = new Subject<FetchResult<CampaignEvent>>();
  private cronJob: CronJob;

  constructor(
    private readonly filePath: string,
    private readonly cronExpression: string,
    private schedulerRegistry: SchedulerRegistry
  ) {
    super();
    this.cronJob = new CronJob(this.cronExpression, this.handleCron.bind(this));
  }

  private parseCsvLine = (line: string): CampaignEvent => {
    const [
      ad,
      ad_id,
      adgroup,
      adgroup_id,
      campaign,
      campaign_id,
      client_id,
      event_name,
      event_time
    ] = line.split(',');

    return {
      ad,
      ad_id,
      adgroup,
      adgroup_id,
      campaign,
      campaign_id,
      client_id,
      event_name: event_name as EventName,
      event_time
    }
  }

  private parseCsv = (content: string): FetchResult<CampaignEvent> => {
    const [_header, ...lines] = content.split("\\n");
      
    const events = lines
      .filter(line => line.trim())
      .map(line => this.parseCsvLine(line));

    if (!this.validateData(events)) {
      throw new Error('Invalid data format in CSV');
    }

    return {
      data: events,
      timestamp: new Date()
    }
  }

  protected validateData(data: unknown): data is CampaignEvent[] {
    if (!Array.isArray(data)) return false;

    const events = data.map(item => plainToInstance(CampaignEventDto, item));
    return events.every(event => validateSync(event).length === 0);
  }

  protected fetch(): Observable<FetchResult<CampaignEvent>> {
    return from(readFile(this.filePath, 'utf-8')).pipe(
      map((content) => this.parseCsv(content.toString()))
    );
  }

  private logFetchResult(result: FetchResult<CampaignEvent>) {
    console.log(`✅ Fetched ${result.data.length} events at ${result.timestamp.toISOString()}`);
  }

  private async handleCron() {
    if (!this.isRunning) return;
    
    try {
      const result = await firstValueFrom(this.fetch());
      this.logFetchResult(result);
      this.result$.next(result);
    } catch (error) {
      console.error('❌ Fetch error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  override start(): Observable<FetchResult<CampaignEvent>> {
    this.isRunning = true;
    this.fetch().subscribe({
      next: (result) => {
        this.logFetchResult(result);
        this.result$.next(result);
      },
      error: (error) => {
        console.error('❌ Fetch error:', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    this.schedulerRegistry.addCronJob('fetch-data', this.cronJob);
    this.cronJob.start();
    
    return this.result$;
  }

  override stop(): void {
    this.isRunning = false;
    if (this.cronJob) {
      this.cronJob.stop();
      this.schedulerRegistry.deleteCronJob('fetch-data');
    }
    this.result$.complete();
  }
} 