import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventDocRef, tryGetEventData } from '../get-data/get-event-data';
import { updateEventTicketsOnTicketPayment } from '../update-event-tickets/update-event-tickets-on-ticket-payment';

interface UpdateEventOnTicketPaymentResponse {
    eventBeforeUpdate: Event;
    vipPriceBeforeUpdate: number;
}

export async function updateEventOnTicketPayment(
    eventId: string,
    isVip: boolean
): Promise<UpdateEventOnTicketPaymentResponse> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = await tryGetEventData(eventId, transaction);

        const updateEventTicketsResponse = await updateEventTicketsOnTicketPayment(event, isVip);

        const eventTickets = updateEventTicketsResponse.eventTicketsAfterUpdate;
        const vipPrice = updateEventTicketsResponse.vipPriceBeforeUpdate;

        const ticketPools = eventTickets.ticketPools;

        const currentPoolPrice = ticketPools.find((pool) => pool.isCurrent)?.ticketPrice;
        const lastPoolPrice = ticketPools[ticketPools.length - 1].ticketPrice;

        const currentPrice = currentPoolPrice ?? lastPoolPrice;

        transaction.update(eventDocRef, {
            attending: event.attending + 1,
            price: currentPrice,
        } as Event);

        return {
            eventBeforeUpdate: event,
            vipPriceBeforeUpdate: vipPrice,
        };
    });
}
