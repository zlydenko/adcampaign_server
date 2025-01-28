import { Injectable } from "@nestjs/common";
import { ValidationError } from "class-validator";

export interface ParsingResult<T> {
    data: Array<T>;
    errors: Array<Error>;
}

export type ValidatingResult<T> = [Error|null, T|null];

@Injectable()
export abstract class Parser<T, U> {
    constructor() {}

    protected abstract extract(data: T): Array<string>;
    protected abstract transform(data: string): unknown;
    protected abstract validate(data: unknown): ValidatingResult<U>;

    protected formatValidationErrors(data: unknown, errors: ValidationError[]): Error {
        const stringifiedErrors = errors
            .map(({constraints}) => Object.values(constraints || {}).join(', '))
            .join(';\n');
        const errorMessage = `Data: ${JSON.stringify(data)}\nErrors: ${stringifiedErrors}`;

        return new Error(errorMessage);
    }

    protected toParsingResult(data: Array<ValidatingResult<U>>): ParsingResult<U> {
        return data.reduce((acc: ParsingResult<U>, val) => {
            const [ error, value ] = val;

            if (error) {
                acc.errors.push(error)
            } else if (value){
                acc.data.push(value)
            }

            return acc;
        }, {data: [], errors: []})
    }

    abstract parse(data: T): ParsingResult<U>;
}