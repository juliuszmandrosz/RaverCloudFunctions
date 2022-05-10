import { Stripe } from 'stripe';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface CancelEventPaymentSession {
    /// Payment intent id
    id: string;
    partnerId: string;
    eventId: string;
    amount: number;
    status: Stripe.PaymentIntent.Status;
    cancelEventCancelationTaskId: string;
    paymentDateTime?: Timestamp;
}
