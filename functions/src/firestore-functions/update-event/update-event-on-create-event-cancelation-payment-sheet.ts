import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventDocRef, tryGetEventData } from '../get-data/get-event-data';
import { updateEventTicketsOnCreateEventCancelationPaymentSheet } from '../update-event-tickets/update-event-tickets-on-create-event-cancelation-payment-sheet';
import { Event } from '../../models/event';
import { getCurrentOrLastPool } from '../../utils/event-tickets-utils/get-current-or-last-pool';

interface UpdateEventOnCreateEventCancelationPaymentSheetParams {
    eventId: string;
    canceledTicketSessionsQuantity: number;
    canceledVipSessionsQuantity: number;
    canceledFunds: number;
}

export async function updateEventOnCreateEventCancelationPaymentSheet({
    eventId,
    canceledTicketSessionsQuantity,
    canceledVipSessionsQuantity,
    canceledFunds,
}: UpdateEventOnCreateEventCancelationPaymentSheetParams): Promise<void> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = await tryGetEventData(eventId, transaction);

        const eventTickets = await updateEventTicketsOnCreateEventCancelationPaymentSheet({
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
