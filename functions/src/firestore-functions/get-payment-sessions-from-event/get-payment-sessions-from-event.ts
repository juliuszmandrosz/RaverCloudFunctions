import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { VipPaymentSession } from '../../models/vip-payment-session';
import { getTicketPaymentSessionsFromEvent } from './get-ticket-payment-sessions-from-event';
import { getVipPaymentSessionsFromEvent } from './get-vip-payment-sessions-from-event';

interface GetPaymentSessionsFromEventResponse {
    ticketSessions: TicketPaymentSession[];
    vipSessions: VipPaymentSession[];
}

export async function getPaymentSessionsFromEvent(
    eventId: string
): Promise<GetPaymentSessionsFromEventResponse> {
    const ticketSessions = await getTicketPaymentSessionsFromEvent(eventId);
    const vipSessions = await getVipPaymentSessionsFromEvent(eventId);

    return { ticketSessions, vipSessions };
}
