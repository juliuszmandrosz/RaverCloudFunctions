import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventDocRef, tryGetEventData } from '../get-data/get-event-data';
import { updateEventTicketsOnCancelUsersPaymentSessions } from '../update-event-tickets/update-event-tickets-on-cancel-users-payment-sessions';
import { Event } from '../../models/event';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';

interface UpdateEventOnCancelPaymentSessionsParams {
    eventId: string;
    canceledTicketSessionsQuantity: number;
    canceledVipSessionsQuantity: number;
    canceledFunds: number;
}

export async function updateEventOnCancelUsersPaymentSessions({
    eventId,
    canceledTicketSessionsQuantity,
    canceledVipSessionsQuantity,
    canceledFunds,
}: UpdateEventOnCancelPaymentSessionsParams): Promise<void> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = await tryGetEventData(eventId, transaction);

        const eventTickets = await updateEventTicketsOnCancelUsersPaymentSessions({
            canceledTicketSessionsQuantity,
            canceledVipSessionsQuantity,
            canceledFunds,
            event,
        });

        const currentPoolPrice = getCurrentOrLastPool(eventTickets.ticketPools).ticketPrice;

        transaction.update(eventDocRef, {
            attending: event.attending - canceledTicketSessionsQuantity,
            price: currentPoolPrice,
        } as Event);
    });
}
