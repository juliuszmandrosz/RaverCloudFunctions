import algoliasearch from 'algoliasearch';
import {env} from '..';
import {clubs, events} from "../constants/collections";

const client = algoliasearch(env.algolia.appid, env.algolia.apikey);
export const eventIndex = client.initIndex(events);
export const clubIndex = client.initIndex(clubs);
