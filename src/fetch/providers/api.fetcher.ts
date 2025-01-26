import { URL } from 'url';
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Observable, Subject, from, firstValueFrom, map, catchError } from 'rxjs';
import { CronJob } from 'cron';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AxiosRequestConfig } from 'axios';

import { DataFetcher, FetchResult } from '../fetcher';
import { CampaignEvent, CampaignEventDto, EventName, FetchSuccessDto } from '../dto';

@Injectable()
export class ApiFetcher extends DataFetcher<CampaignEvent> {
  private static readonly CONFIG = {
    BATCH_SIZE: 1000,
    PAGINATION_DELAY: 1000,
    EVENT_TYPES: [EventName.PURCHASE, EventName.INSTALL]
  } as const;

  private readonly state = {
    isRunning: false,
    result$: new Subject<FetchResult<CampaignEvent>>(),
    paginationQueue: new Set<{ url: string; eventName: EventName }>(),
    cronJob: undefined as CronJob | undefined
  };

  private readonly api = {
    url: '',
    key: '',
    headers: { 
      Accept: 'application/json',
      'x-api-key': ''
    } as Record<string, string>
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly cronExpression: string,
    private schedulerRegistry: SchedulerRegistry
  ) {
    super();
    this.initializeApi();
    this.initializeCronJob();
  }

  private initializeApi(): void {
    this.api.url = this.configService.getOrThrow('api.url');
    this.api.key = this.configService.getOrThrow('api.key');
    this.api.headers['x-api-key'] = this.api.key;
  }

  private initializeCronJob(): void {
    this.state.cronJob = new CronJob(
      this.cronExpression, 
      () => this.handleCron().catch(this.handleError)
    );
  }

  private getDateRange() {
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1); //? for testing only
    start.setHours(0, 0, 0, 0);
    
    return { start, end };
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private constructUrl(event_name: EventName): AxiosRequestConfig {
    const { start, end } = this.getDateRange();
    const url = new URL(this.api.url);

    url.searchParams.append('from_date', this.formatDate(start));
    url.searchParams.append('to_date', this.formatDate(end));
    url.searchParams.append('event_name', event_name);
    url.searchParams.append('take', ApiFetcher.CONFIG.BATCH_SIZE.toString());

    return {
      url: url.toString(),
      headers: this.api.headers,
      method: 'GET'
    };
  }

  private async makeRequest(config: AxiosRequestConfig): Promise<FetchSuccessDto> {
    const { data } = await axios(config);
    const response = plainToInstance(FetchSuccessDto, data);
    
    if (validateSync(response).length > 0) {
      throw new Error('Invalid response format');
    }

    return response;
  }

  private parseEvents(csv: string): CampaignEvent[] {
    const [_header, ...lines] = csv.split('\n');
    return lines
      .filter(line => line.trim())
      .map(this.parseCsvLine);
  }

  private parseCsvLine(line: string): CampaignEvent {
    const [
      ad, ad_id, adgroup, adgroup_id,
      campaign, campaign_id, client_id,
      event_name, event_time
    ] = line.split(',');

    return {
      ad, ad_id, adgroup, adgroup_id,
      campaign, campaign_id, client_id,
      event_name: event_name as EventName,
      event_time
    };
  }

  private async fetchEventType(eventName: EventName): Promise<CampaignEvent[]> {
    try {
      const response = await this.makeRequest(this.constructUrl(eventName));
      const events = this.parseEvents(response.data.csv);

      if (response.data.pagination?.next) {
        this.state.paginationQueue.add({ url: response.data.pagination.next, eventName });
      }

      return events;
    } catch (error) {
      this.handleError(error, `Failed to fetch ${eventName} events`);
      return [];
    }
  }

  protected fetch(): Observable<FetchResult<CampaignEvent>> {
    return from(Promise.all(
      ApiFetcher.CONFIG.EVENT_TYPES.map(type => this.fetchEventType(type))
    )).pipe(
      map(results => ({
        data: results.flat(),
        timestamp: new Date()
      })),
      catchError(error => {
        this.handleError(error);
        return [];
      })
    );
  }

  private async handlePagination(): Promise<void> {
    while (this.state.paginationQueue.size > 0 && this.state.isRunning) {
      const item = this.state.paginationQueue.values().next().value;
      this.state.paginationQueue.delete(item);

      try {
        const response = await this.makeRequest(this.constructUrl(item.eventName));

        const events = this.parseEvents(response.data.csv);
        if (this.validateData(events)) {
          this.state.result$.next({
            data: events,
            timestamp: new Date()
          });
        }

        if (response.data.pagination?.next) {
          this.state.paginationQueue.add({
            url: response.data.pagination.next,
            eventName: item.eventName
          });
        }

        await new Promise(resolve => setTimeout(resolve, ApiFetcher.CONFIG.PAGINATION_DELAY));
      } catch (error) {
        this.handleError(error, `Failed to fetch paginated ${item.eventName} events`);
        break;
      }
    }
  }

  private handleError(error: unknown, context = 'Fetch error'): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ ${context}:`, message);
    
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
    }
  }

  private async handleCron() {
    if (!this.state.isRunning) return;
    
    try {
      const result = await firstValueFrom(this.fetch());
      this.state.result$.next(result);

      if (this.state.paginationQueue.size > 0) {
        await this.handlePagination();
      }
    } catch (error) {
      console.error('❌ Fetch error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  override start(): Observable<FetchResult<CampaignEvent>> {
    this.state.isRunning = true;
    this.fetch().subscribe({
      next: async (result) => {
        this.state.result$.next(result);
        
        if (this.state.paginationQueue.size > 0) {
          await this.handlePagination();
        }
      },
      error: (error) => {
        console.error('❌ Fetch error:', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    if (this.state.cronJob) {
      this.schedulerRegistry.addCronJob('fetch-data', this.state.cronJob);
      this.state.cronJob.start();
    }
    
    return this.state.result$;
  }

  override stop(): void {
    this.state.isRunning = false;
    if (this.state.cronJob) {
      this.state.cronJob.stop();
      this.schedulerRegistry.deleteCronJob('fetch-data');
    }
    this.state.result$.complete();
  }

  protected validateData(data: unknown): data is CampaignEvent[] {
    if (!Array.isArray(data)) return false;

    const events = data.map(item => plainToInstance(CampaignEventDto, item));
    return events.every(event => validateSync(event).length === 0);
  }
} 