import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export abstract class Storage<T> {
  abstract save(data: T[]): Observable<void>;
}