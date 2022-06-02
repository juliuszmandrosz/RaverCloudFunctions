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
    clubIncome: number;
    userFeeAmount: number;
    promotionCodeAmountOff: number;
    paymentDateTime?: Timestamp;
    promotionCode?: string;
}
