import algoliasearch from 'algoliasearch';
import {artists, clubs, collectives, events} from '../constants/collections';
import {getFunctionsConfig} from '../utils/get-functions-config';

const config = getFunctionsConfig().algolia;
const client = algoliasearch(config.app_id, config.api_key);
export const eventsIndex = client.initIndex(events);
export const clubsIndex = client.initIndex(clubs);
export const collectivesIndex = client.initIndex(collectives);
export const artistsIndex = client.initIndex(artists);
