import { IsString, IsEnum } from 'class-validator';

export enum EventName {
  PURCHASE = 'purchase',
  INSTALL = 'install'
}

export class CampaignEventDto {
  @IsString()
  ad: string;

  @IsString()
  ad_id: string;

  @IsString()
  adgroup: string;

  @IsString()
  adgroup_id: string;

  @IsString()
  campaign: string;

  @IsString()
  campaign_id: string;

  @IsString()
  client_id: string;

  @IsEnum(EventName)
  event_name: EventName;

  @IsString()
  event_time: string;
}

export type CampaignEvent = {
  ad: string;
  ad_id: string;
  adgroup: string;
  adgroup_id: string;
  campaign: string;
  campaign_id: string;
  client_id: string;
  event_name: EventName;
  event_time: string;
}