import { Stripe } from 'stripe';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface TicketPaymentSession {
    /// Payment intent id
    id: string;
    transferGroupId: string;
    userId: string;
    eventId: string;
    amount: number;
    status: Stripe.PaymentIntent.Status;
    isVip: boolean;
    cancelTicketReservationTaskId?: string;
    promotionCode?: string;
    transferId?: string;
    paymentDateTime?: Timestamp;
    ticketId: string;
}
