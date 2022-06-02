import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Stripe } from 'stripe';

export interface VipPaymentSession {
    /// Payment intent id
    id: string;
    ticketId: string;
    eventId: string;
    userId: string;
    status: Stripe.PaymentIntent.Status;
    isRefunded: boolean;
    revenue: number;
    serviceFeeAmount: number;
    promotionCodeAmountOff: number;
    paymentDateTime?: Timestamp;
    promotionCode?: string;
}
