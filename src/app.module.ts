import { Module } from '@nestjs/common';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from './config';
import { StorageModule } from './storage';
import { ApiFetcher, DataFetcher, FetchService } from './fetch';
import { CampaignReport } from './storage/entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('db.host'),
        port: configService.getOrThrow('db.port'),
        username: configService.getOrThrow('db.user'),
        password: configService.getOrThrow('db.pass'),
        database: configService.getOrThrow('db.name'),
        entities: [CampaignReport],
        migrations: ['dist/storage/migrations/*.js'],
        migrationsRun: true,
        synchronize: false
      })
    }),
    ScheduleModule.forRoot(),
    StorageModule,
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