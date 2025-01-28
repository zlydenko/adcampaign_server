import axios, { AxiosRequestConfig } from "axios";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { EventName, FetchSuccessDto } from "../dto";

export class ExternalApiService {
    private readonly DEFAULT_BATCH_SIZE = 1000;
    private readonly api = {
        url: '',
        key: '',
        headers: { 
          Accept: 'application/json',
          'x-api-key': ''
        } as Record<string, string>
    };

    constructor(apiUrl: string, privateKey: string) {
        this.api.url = apiUrl;
        this.api.key = privateKey;
        this.api.headers['x-api-key'] = this.api.key;
    }
    
    async makeRequest(config: AxiosRequestConfig): Promise<FetchSuccessDto> {
        const { data } = await axios(config);
        const response = plainToInstance(FetchSuccessDto, data);
        
        if (validateSync(response).length > 0) {
            throw new Error('Invalid response format');
        }

        return response;
    }
    
    constructUrl(
        event_name: EventName,
        batchSize: number = this.DEFAULT_BATCH_SIZE,
        fromDate?: string,
        toDate?: string
    ): AxiosRequestConfig {
        const url = new URL(this.api.url);
        
        if (fromDate && toDate) {
          url.searchParams.append('from_date', fromDate);
          url.searchParams.append('to_date', toDate);
        }
    
        url.searchParams.append('event_name', event_name);
        url.searchParams.append('take', batchSize.toString());
    
        return {
            url: url.toString(),
            headers: this.api.headers,
            method: 'GET'
        };
    }
    
    getHeaders(): Record<string, string> {
        return { ...this.api.headers };
    }
}