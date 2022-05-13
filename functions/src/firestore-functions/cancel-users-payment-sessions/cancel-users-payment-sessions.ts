import { cancelUsersTicketPaymentSessions } from './cancel-users-ticket-payment-sessions';
import { cancelUsersVipPaymentSessions } from './cancel-users-vip-payment-sessions';
import { updateEventOnCancelUsersPaymentSessions } from '../update-event/update-event-on-cancel-users-payment-sessions';

export async function cancelUsersPaymentSessions(eventId: string) {
    const cancelTicketsSessionsResponse = await cancelUsersTicketPaymentSessions(eventId);

    await cancelUsersVipPaymentSessions(eventId);

    await updateEventOnCancelUsersPaymentSessions({
        eventId,
        canceledTicketSessionsQuantity:
            cancelTicketsSessionsResponse.canceledTicketSessionsQuantity,
        canceledFunds: cancelTicketsSessionsResponse.canceledFunds,
        canceledVipSessionsQuantity: cancelTicketsSessionsResponse.canceledVipSessionsQuantity,
    });
}
