import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('campaign_reports')
@Index(['event_time', 'client_id', 'event_name'], { unique: true })
export class CampaignReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  campaign: string;

  @Column()
  campaign_id: string;

  @Column()
  adgroup: string;

  @Column()
  adgroup_id: string;

  @Column()
  ad: string;

  @Column()
  ad_id: string;

  @Column()
  client_id: string;

  @Column({
    type: 'enum',
    enum: ['purchase', 'install']
  })
  event_name: string;

  @Column()
  event_time: string;
} 