import { Stripe } from 'stripe';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface TicketPaymentSession {
    /// Payment intent id
    id: string;
    userId: string;
    stripeCustomerId: string;
    eventId: string;
    ticketId: string;
    status: Stripe.PaymentIntent.Status;
    isVip: boolean;
    cancelTicketReservationTaskId: string;
    isRefunded: boolean;
    revenue: number;
    serviceFeeAmount: number;
    promotionCodeAmountOff: number;
    sendInvoice: boolean;
    promotionCode?: string;
    paymentDateTime?: Timestamp;
}
