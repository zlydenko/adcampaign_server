import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Storage } from './storage';
import { PostgresStorage } from './providers';
import { CampaignReport } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignReport])
  ],
  providers: [
    {
      provide: Storage,
      useClass: PostgresStorage
    }
  ],
  exports: [Storage]
})
export class StorageModule {} 