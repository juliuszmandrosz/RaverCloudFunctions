import { stripe } from '../../modules/stripe-module';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { partners, payouts } from '../../constants/collections';
import { Payout } from '../../models/payout';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Stripe } from 'stripe';

interface CreatePayoutParams {
    amount: number;
    currency: string;
    connectedAccountId: string;
    partnerId: string;
}

export async function createPayout({
    amount,
    currency,
    connectedAccountId,
    partnerId,
}: CreatePayoutParams) {
    let payout: Stripe.Payout;

    try {
        payout = await stripe.payouts.create(
            {
                amount,
                currency,
            },
            { stripeAccount: connectedAccountId }
        );
    } catch (e) {
        if (
            e instanceof Stripe.errors.StripeError &&
            (e.code === 'amount_too_small' || e.code === 'parameter_invalid_integer')
        ) {
            return;
        }

        throw e;
    }

    await firestoreDatabase()
        .collection(partners)
        .doc(partnerId)
        .collection(payouts)
        .doc(payout.id)
        .set({
            amount,
            currency,
            payoutDateTime: Timestamp.now(),
        } as Payout);
}
