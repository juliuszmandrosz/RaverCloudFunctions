import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventDataOrReturnNotFound,
    getEventDocRef,
    tryGetEventData,
} from '../get-data/get-event-data';
import { updateEventTicketsOnCancelUsersPaymentSessions } from '../update-event-tickets/update-event-tickets-on-cancel-users-payment-sessions';
import { Event } from '../../models/event';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';
import * as functions from 'firebase-functions';
import { toJson } from '../../utils/json-utils';

interface UpdateEventOnCancelPaymentSessionsParams {
    eventId: string;
    canceledTicketSessionsQuantity: number;
    canceledVipSessionsQuantity: number;
    canceledFunds: number;
    response?: functions.Response;
}

export async function updateEventOnCancelUsersPaymentSessions({
    eventId,
    canceledTicketSessionsQuantity,
    canceledVipSessionsQuantity,
    canceledFunds,
    response,
}: UpdateEventOnCancelPaymentSessionsParams): Promise<void> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = response
            ? await getEventDataOrReturnNotFound(eventId, response, transaction)
            : await tryGetEventData(eventId, transaction);

        if (!event) return;

        const eventTickets = await updateEventTicketsOnCancelUsersPaymentSessions({
            canceledTicketSessionsQuantity,
            canceledVipSessionsQuantity,
            canceledFunds,
            event,
        });

        if (!eventTickets) return;

        const currentPoolPrice = getCurrentOrLastPool(eventTickets.ticketPools).ticketPrice;

        transaction.update(
            eventDocRef,
            toJson({
                attending: event.attending - canceledTicketSessionsQuantity,
                price: currentPoolPrice,
            } as Event)
        );
    });
}
