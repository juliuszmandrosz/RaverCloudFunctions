import algoliasearch from 'algoliasearch';
import { clubs, events } from '../constants/collections';
import { getFunctionsConfig } from '../utils/get-functions-config';

const config = getFunctionsConfig().algolia;
const client = algoliasearch(config.app_id, config.api_key);
export const eventIndex = client.initIndex(events);
export const clubIndex = client.initIndex(clubs);
