import { Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';

export interface FetchResult<T> {
    data: T[];
    timestamp: Date;
}

@Injectable()
export abstract class DataFetcher<T> {
  constructor() {}

  protected abstract fetch(): Observable<FetchResult<T>>;
  
  abstract start(): Observable<FetchResult<T>>;
  abstract stop(): void;
  abstract fetchDateRange(fromDate: string, toDate: string): Observable<void>;
}