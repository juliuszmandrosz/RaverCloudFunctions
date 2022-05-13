import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventDocRef, tryGetEventData } from '../get-data/get-event-data';
import { updateEventTicketsOnTicketReturn } from '../update-event-tickets/update-event-tickets-on-ticket-return';
import { updateEventCostsOnTicketReturn } from '../update-event-costs/update-event-costs-on-ticket-return';

interface UpdateEventOnTicketReturnParams {
    eventId: string;
    ticketPaymentSessionId: string;
    isVip: boolean;
    vipPaymentSessionId?: string;
}

/// Returns event before update
export async function updateEventOnTicketReturn({
    eventId,
    ticketPaymentSessionId,
    isVip,
    vipPaymentSessionId,
}: UpdateEventOnTicketReturnParams): Promise<Event> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = await tryGetEventData(eventId, transaction);

        const eventTickets = await updateEventTicketsOnTicketReturn(event, isVip);

        await updateEventCostsOnTicketReturn({
            eventId,
            clubId: event.clubId,
            ticketPaymentSessionId,
            vipPaymentSessionId,
        });

        const ticketPools = eventTickets.ticketPools;

        const currentPoolPrice = ticketPools.find((pool) => pool.isCurrent)!.ticketPrice;

        transaction.update(eventDocRef, {
            attending: event.attending - 1,
            price: currentPoolPrice,
        } as Event);

        return event;
    });
}
