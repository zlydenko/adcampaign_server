import { Module } from '@nestjs/common';
import { VersioningType, INestApplication } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { CampaignReportsController } from './controllers/campaign-reports.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CampaignReportsController],
})
export class ApiModule {
  static forRoot() {
    return {
      module: ApiModule,
      configure: (app: INestApplication) => {
        app.enableVersioning({
          type: VersioningType.HEADER,
          header: 'Accept-Version',
        });
      },
    };
  }
}