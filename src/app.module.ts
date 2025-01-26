import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ConfigModule } from './config';
import { FetchModule } from './fetch';
import { DatabaseModule } from './database';
import { ApiModule } from './api';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    ApiModule,
    FetchModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 