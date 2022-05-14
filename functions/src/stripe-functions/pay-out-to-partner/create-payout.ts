import { stripe } from '../../modules/stripe-module';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { partners, payouts } from '../../constants/collections';
import { Payout } from '../../models/payout';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

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
    const payout = await stripe.payouts.create(
        {
            amount,
            currency,
        },
        { stripeAccount: connectedAccountId }
    );

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
