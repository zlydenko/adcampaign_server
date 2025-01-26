import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataFetcher } from '../fetcher';
import { CampaignEvent } from '../dto';

@Injectable()
export class FetchService implements OnModuleInit {
  constructor(
    private readonly fetcher: DataFetcher<CampaignEvent>
  ) {}

  onModuleInit() {
    console.log('🔄 Starting data fetcher...');
    this.fetcher.start().subscribe();
  }
} 