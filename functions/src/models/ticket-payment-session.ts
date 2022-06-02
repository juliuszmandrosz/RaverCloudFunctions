import { Stripe } from 'stripe';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface TicketPaymentSession {
    /// Payment intent id
    id: string;
    userId: string;
    eventId: string;
    ticketId: string;
    status: Stripe.PaymentIntent.Status;
    isVip: boolean;
    cancelTicketReservationTaskId: string;
    isRefunded: boolean;
    clubIncome: number;
    serviceFeeAmount: number;
    promotionCodeAmountOff: number;
    promotionCode?: string;
    paymentDateTime?: Timestamp;
}
