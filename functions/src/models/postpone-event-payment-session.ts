import { Stripe } from 'stripe';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface PostponeEventPaymentSession {
    /// Payment intent id
    id: string;
    partnerId: string;
    eventId: string;
    amount: number;
    status: Stripe.PaymentIntent.Status;
    cancelEventPostponeTaskId: string;
    newEventStartDateTime: Timestamp;
    newEventEndDateTime: Timestamp;
    paymentDateTime?: Timestamp;
}
