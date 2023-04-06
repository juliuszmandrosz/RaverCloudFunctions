import Typesense from 'typesense';
import {getFunctionsConfig} from '../utils/get-functions-config';
import {clubs, events, wallPhotos} from '../constants/collections';

const config = getFunctionsConfig().typesense;
const client = new Typesense.Client({
    nodes: [
        {
            host: config.cluster_id,
            port: 443,
            protocol: 'https',
        },
    ],
    apiKey: config.api_key,
    connectionTimeoutSeconds: 10,
    numRetries: 3,
});

export const eventCollection = client.collections(events);
export const clubCollection = client.collections(clubs);
export const wallPhotoCollection = client.collections(wallPhotos);
