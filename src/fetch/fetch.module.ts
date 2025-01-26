import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import { CampaignReportService, DatabaseModule } from '../database';
import { ApiFetcher, FetchService } from './providers';
import { DataFetcher } from './fetcher';

@Module({
    imports: [ DatabaseModule ],
    providers: [
        {
            provide: DataFetcher,
            inject: [ConfigService, SchedulerRegistry, CampaignReportService],
            useFactory: (
                configService: ConfigService,
                schedulerRegistry: SchedulerRegistry,
                campaignReportService: CampaignReportService
            ) => {
                const cronExpression = configService.get<string>('fetch_cron') as string;
                return new ApiFetcher(
                    configService,
                    cronExpression,
                    schedulerRegistry,
                    campaignReportService
                );
            },
        },
        FetchService
    ],
  exports: [ DataFetcher ]
})
export class FetchModule {} 