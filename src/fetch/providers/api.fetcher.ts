import { URL } from 'url';
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Observable, Subject, from, firstValueFrom, map, catchError, mergeMap, of } from 'rxjs';
import { CronJob } from 'cron';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AxiosRequestConfig } from 'axios';

import { CampaignReportService } from '../../database';
import { DataFetcher, FetchResult } from '../fetcher';
import { CampaignEvent, CampaignEventDto, EventName, FetchSuccessDto } from '../dto';
import { Parser } from '../parser';

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
    private readonly _config: ConfigService,
    private readonly _cronExpression: string,
    private schedulerRegistry: SchedulerRegistry,
    private campaignReportService: CampaignReportService,
    private parser: Parser<string, CampaignEventDto>
  ) {
    super();
    this.initializeApi();
    this.initializeCronJob();
  }

  private initializeApi(): void {
    this.api.url = this._config.getOrThrow('api.url');
    this.api.key = this._config.getOrThrow('api.key');
    this.api.headers['x-api-key'] = this.api.key;
  }

  private initializeCronJob(): void {
    this.state.cronJob = new CronJob(
      this._cronExpression, 
      () => this.handleCron().catch(this.handleError)
    );
  }

  private getDateRange() {
    const end = new Date();
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    
    return { start, end };
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private constructUrl(
    event_name: EventName,
    fromDate?: string,
    toDate?: string
  ): AxiosRequestConfig {
    const url = new URL(this.api.url);
    
    if (fromDate && toDate) {
      url.searchParams.append('from_date', fromDate);
      url.searchParams.append('to_date', toDate);
    } else {
      const { start, end } = this.getDateRange();
      url.searchParams.append('from_date', this.formatDate(start));
      url.searchParams.append('to_date', this.formatDate(end));
    }

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

  private async fetchEventType(eventName: EventName): Promise<CampaignEvent[]> {
    try {
      const response = await this.makeRequest(this.constructUrl(eventName));
      const events = this.parser.parse(response.data.csv);

      const { data: parsedData, errors: parsingErrors } = events;

      if (parsingErrors.length) {
        parsingErrors.forEach(error => console.error(error.message))
      }

      if (response.data.pagination?.next) {
        this.state.paginationQueue.add({ url: response.data.pagination.next, eventName });
      }

      return parsedData;
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
        const response = await this.makeRequest({ 
          url: item.url, 
          headers: this.api.headers 
        });

        const events = this.parser.parse(response.data.csv);
        const { data: parsedData, errors: parsingErrors } = events;

        if (parsingErrors.length) {
          parsingErrors.forEach(error => console.error(error.message))
        }

        const result = {
          data: parsedData,
          timestamp: new Date()
        };
        
        this.state.result$.next(result);

        if (parsedData.length > 0) {
          this.campaignReportService.saveReports(parsedData).subscribe({
            error: (error) => this.handleError(error, 'Failed to save paginated reports to database')
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

      if (result.data.length > 0) {
        this.campaignReportService.saveReports(result.data).subscribe({
          error: (error) => this.handleError(error, 'Failed to save reports to database')
        });
      }

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

  override fetchDateRange(fromDate: string, toDate: string): Observable<void> {
    const urls = ApiFetcher.CONFIG.EVENT_TYPES.map(eventName => 
      this.constructUrl(eventName, fromDate, toDate)
    );

    return from(urls).pipe(
      mergeMap(config => 
        from(this.makeRequest(config)).pipe(
          mergeMap(response => {
            const events = this.parser.parse(response.data.csv);
            const { data: parsedData, errors: parsingErrors } = events;

            if (parsingErrors.length) {
              parsingErrors.forEach(error => console.error(error.message))
            }

            if (parsedData.length > 0) {
              return this.campaignReportService.saveReports(parsedData);
            }

            return of(void 0);
          })
        )
      )
    );
  }
} 