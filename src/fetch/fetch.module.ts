import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import { CampaignReportService, DatabaseModule } from '../database';
import { ApiFetcher, CsvParser, FetchService } from './providers';
import { DataFetcher } from './fetcher';
import { Parser } from './parser';
import { CampaignEventDto } from './dto';

@Module({
    imports: [ DatabaseModule ],
    providers: [
        {
            provide: Parser,
            useClass: CsvParser
        },
        {
            provide: DataFetcher,
            inject: [ConfigService, SchedulerRegistry, CampaignReportService, Parser],
            useFactory: (
                configService: ConfigService,
                schedulerRegistry: SchedulerRegistry,
                campaignReportService: CampaignReportService,
                parser: Parser<string, CampaignEventDto>
            ) => {
                const cronExpression = configService.get<string>('fetch_cron') as string;
                return new ApiFetcher(
                    configService,
                    cronExpression,
                    schedulerRegistry,
                    campaignReportService,
                    parser
                );
            },
        },
        FetchService
    ],
  exports: [ DataFetcher ]
})
export class FetchModule {} 