import * as functions from 'firebase-functions';
import { GetVipPriceRequest } from './get-vip-price-request';
import { tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';

export async function getVipPrice(data: GetVipPriceRequest): Promise<number> {
    const eventId = data?.eventId;
    const clubId = data?.clubId;

    if (!eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
    if (!clubId) {
        const message = 'The function must be called with club id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const eventTickets = await tryGetEventTicketsData(clubId, eventId);

    const currentPool = getCurrentOrLastPool(eventTickets.ticketPools);

    return currentPool.vipPrice;
}
