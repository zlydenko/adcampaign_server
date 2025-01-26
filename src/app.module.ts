import { Module } from '@nestjs/common';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { ConfigModule } from './config';
import { ApiFetcher, DataFetcher, FetchService } from './fetch';
import { DatabaseModule, CampaignReportService } from './database';
import { ApiModule } from './api';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    ApiModule
  ],
  controllers: [],
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
})
export class AppModule {} 