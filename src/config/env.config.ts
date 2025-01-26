import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { 
    RequiredEnvironmentVariables, 
    EnvironmentVariables, 
    DbConfigDto, 
    ApiConfigDto 
} from './dto';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

const parseDbConfig = (config: Record<string, unknown>): Partial<DbConfigDto> => {
  return {
    ...(isString(config.DB_HOST) && { host: config.DB_HOST }),
    ...(isString(config.DB_PORT) && { port: parseInt(config.DB_PORT, 10) }),
    ...(isString(config.DB_USER) && { user: config.DB_USER }),
    ...(isString(config.DB_PASS) && { pass: config.DB_PASS }),
    ...(isString(config.DB_NAME) && { name: config.DB_NAME }),
  };
}

const parseApiConfig = (config: Record<string, unknown>): Partial<ApiConfigDto> => {
  return {
    ...(isString(config.API_URL) && { url: config.API_URL }),
    ...(isString(config.API_KEY) && { key: config.API_KEY }),
  };
}

const validatePort = (config: Record<string, unknown>): number => {
  if (!isString(config.PORT)) {
    console.error('❗ PORT is required!');
    throw new Error('PORT is required');
  }
  return parseInt(config.PORT, 10);
}

const validateFetchCron = (config: Record<string, unknown>): string => {
    if (!isString(config.FETCH_CRON)) {
        console.error('❗ FETCH_CRON is required!');
        throw new Error('FETCH_CRON is required');
    }

    return config.FETCH_CRON;
}

const requiredValidations: [keyof RequiredEnvironmentVariables, (config: Record<string, unknown>) => any][] = [
  ['port', validatePort],
  ['fetch_cron', validateFetchCron]
];

const logConfigWarnings = (dbConfig: Partial<DbConfigDto>, apiConfig: Partial<ApiConfigDto>) => {
  const dbMissing = DbConfigDto.getMissingProperties(dbConfig);
  const apiMissing = ApiConfigDto.getMissingProperties(apiConfig);

  if (dbMissing.length === 4) {
    console.warn('⚠️  Database env variables not provided (ignore if don\'t use db to store campaign reports)');
  } else if (dbMissing.length > 0) {
    console.warn('⚠️  Database env variables missing properties (ignore if don\'t use db to store campaign reports):');
    dbMissing.forEach(prop => console.warn(`  - ${prop}`));
  }

  if (apiMissing.length === 2) {
    console.warn('⚠️  API env variables not provided (ignore if don\'t fetch ad data from external API)');
  } else if (apiMissing.length > 0) {
    console.warn('⚠️  API env variables missing properties (ignore if don\'t fetch ad data from external API):');
    apiMissing.forEach(prop => console.warn(`  - ${prop}`));
  }

  return { dbMissing, apiMissing };
}

export const validate = (config: Record<string, unknown>) => {
  const {
    port, 
    fetch_cron
  } = requiredValidations.reduce((acc, [k, validateFn]) => ({
    ...acc,
    [k]: validateFn(config)
  }), {}) as RequiredEnvironmentVariables;
  const dbConfig = parseDbConfig(config);
  const apiConfig = parseApiConfig(config);
  
  const { dbMissing, apiMissing } = logConfigWarnings(dbConfig, apiConfig);

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      port,
      fetch_cron,
      db: dbMissing.length === 0 ? dbConfig : undefined,
      api: apiMissing.length === 0 ? apiConfig : undefined,
    },
    { enableImplicitConversion: true },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    console.warn('Configuration warnings:');
    console.warn(errors.toString());
  }

  return validatedConfig;
} 