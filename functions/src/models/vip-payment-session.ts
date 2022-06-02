import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Stripe } from 'stripe';

export interface VipPaymentSession {
    /// Payment intent id
    id: string;
    transferGroupId: string;
    ticketId: string;
    eventId: string;
    userId: string;
    amount: number;
    status: Stripe.PaymentIntent.Status;
    isRefunded: boolean;
    promotionCodeAmountOff: number;
    paymentDateTime?: Timestamp;
    promotionCode?: string;
}
