import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService, ConfigModule } from '@nestjs/config';

import { CampaignReport } from './entities/campaign-report.entity';
import { CampaignReportService } from './providers/campaign-report.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('db');
        
        if (!dbConfig) {
          throw new Error('Database configuration is missing');
        }

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.user,
          password: dbConfig.pass,
          database: dbConfig.name,
          entities: [CampaignReport],
          synchronize: false,
          logging: false
        };
      }
    }),
    TypeOrmModule.forFeature([CampaignReport])
  ],
  providers: [CampaignReportService],
  exports: [TypeOrmModule, CampaignReportService]
})
export class DatabaseModule {} 