import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import { ConfigModule } from './config';
import { ApiFetcher, FetchService, DataFetcher } from './fetch';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot()
  ],
  controllers: [],
  providers: [
    {
      provide: DataFetcher,
      inject: [ConfigService, SchedulerRegistry],
      useFactory: (configService: ConfigService, schedulerRegistry: SchedulerRegistry) => {
        const cronExpression = configService.get<string>('fetch_cron') as string;
        return new ApiFetcher(configService, cronExpression, schedulerRegistry);
      },
    },
    FetchService
  ],
})
export class AppModule {} 