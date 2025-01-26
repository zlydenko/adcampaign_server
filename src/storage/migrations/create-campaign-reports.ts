import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCampaignReports1706300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'campaign_reports',
        columns: [
          {
            name: 'campaign',
            type: 'varchar',
          },
          {
            name: 'campaign_id',
            type: 'varchar',
          },
          {
            name: 'adgroup',
            type: 'varchar',
          },
          {
            name: 'adgroup_id',
            type: 'varchar',
          },
          {
            name: 'ad',
            type: 'varchar',
          },
          {
            name: 'ad_id',
            type: 'varchar',
          },
          {
            name: 'client_id',
            type: 'varchar',
          },
          {
            name: 'event_name',
            type: 'enum',
            enum: ['purchase', 'install']
          },
          {
            name: 'event_time',
            type: 'varchar',
          }
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'campaign_reports',
      new TableIndex({
        name: 'IDX_campaign_reports_unique_event',
        columnNames: ['event_time', 'client_id', 'event_name'],
        isUnique: true
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('campaign_reports');
  }
} 