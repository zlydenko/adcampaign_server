import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { Parser, ValidatingResult } from "../parser";
import { CampaignEventDto } from "../dto";

@Injectable()
export class CsvParser extends Parser<string, CampaignEventDto> {
    constructor() {
        super();
    }

    extract(csv: string) {
        const [_header, ...lines] = csv.split('\n');
        return lines.filter(line => line.trim())
    }

    transform(line: string) {
        const [
            ad, ad_id, adgroup, adgroup_id,
            campaign, campaign_id, client_id,
            event_name, event_time
        ] = line.split(',');

        return {
            ad, ad_id, adgroup, adgroup_id,
            campaign, campaign_id, client_id,
            event_name, event_time
        };
    }

    validate(data: unknown): ValidatingResult<CampaignEventDto> {
        const result = plainToInstance(CampaignEventDto, data);
        const validationErrors = validateSync(result);

        return validationErrors.length > 0 ?
            [this.formatValidationErrors(data, validationErrors), null] :
            [null, result];
    }

    parse(csv: string) {
        const validatedData = this.extract(csv)
            .map(this.transform)
            .map(r => this.validate(r))

        return this.toParsingResult(validatedData)
    }
}
