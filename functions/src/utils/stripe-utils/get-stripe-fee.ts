import { Stripe } from 'stripe';
import { stripe } from '../../modules/stripe-module';
import * as functions from 'firebase-functions';

const errorMessage = 'Stripe fee for given payment session does not exists';

export async function getStripeFeeOrReturnNotFound(
    paymentSessionId: string,
    response: functions.Response
) {
    const stripeFee = await getStripeFee(paymentSessionId);

    if (!stripeFee) {
        response.status(404).send(errorMessage);
        return;
    }

    return stripeFee;
}

export async function tryGetStripeFee(paymentSessionId: string) {
    const stripeFee = await getStripeFee(paymentSessionId);

    if (!stripeFee) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return stripeFee;
}

async function getStripeFee(paymentSessionId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentSessionId, {
        expand: ['charges.data.balance_transaction'],
    });
    const balanceTransaction = paymentIntent.charges.data[0]
        .balance_transaction as Stripe.BalanceTransaction;

    const stripeFeeDetails = balanceTransaction.fee_details.find(
        (fee) => fee.type === 'stripe_fee'
    );

    return stripeFeeDetails?.amount;
}
