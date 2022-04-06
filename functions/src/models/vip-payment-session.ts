import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Stripe } from 'stripe';

export interface VipPaymentSession {
    /// Payment intent id
    id: string;
    transferGroupId: string;
    ticketId: string;
    userId: string;
    amount: number;
    status: Stripe.PaymentIntent.Status;
    transferId?: string;
    paymentDateTime?: Timestamp;
    promotionCode?: string;
}
