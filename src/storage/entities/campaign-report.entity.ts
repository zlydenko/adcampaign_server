import { Entity, Column, Index } from 'typeorm';

import { EventName } from '../../fetch';

@Entity('campaign_reports')
@Index(['event_time', 'client_id', 'event_name'], { unique: true })
export class CampaignReport {
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
    enum: EventName
  })
  event_name: EventName;

  @Column()
  event_time: string;
} 