import * as functions from 'firebase-functions';
import { stripe } from '../../modules/stripe-module';
import { CreatePaymentSheetForPartnerRequest } from './create-payment-sheet-for-partner-request';
import { CreatePaymentSheetForPartnerResponse } from './create-payment-sheet-for-partner-response';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { getStripeCustomerIdFromContext } from '../../utils/stripe-utils/get-stripe-customer-id-from-context';
import { tryCreateEphemeralKey } from '../../utils/stripe-utils/try-create-ephemeral-key';
import { getPaymentMethodTypes } from '../../utils/stripe-utils/get-payment-method-types';
import { getPaymentIntentAmount } from '../../utils/stripe-utils/get-payment-intent-amount';

export async function createPaymentSheetForPartner(
    data: CreatePaymentSheetForPartnerRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForPartnerResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const amount = data?.amount;
    const description = data?.description;
    const currency = data?.currency;
    const customerId = await getStripeCustomerIdFromContext(context);
    const userEmail = context.auth!.token.email!;

    const ephemeralKeySecret = await tryCreateEphemeralKey(customerId);
    const paymentMethodTypes = getPaymentMethodTypes(currency);
    const paymentIntentAmount = getPaymentIntentAmount(amount);

    const paymentIntent = await stripe.paymentIntents.create({
        currency,
        description,
        amount: paymentIntentAmount,
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        receipt_email: userEmail,
    });

    if (!paymentIntent.client_secret) {
        const message = 'Error creating payment intent';
        throw new functions.https.HttpsError('internal', message);
    }

    return {
        customerId,
        ephemeralKeySecret,
        paymentIntentSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
}

function checkIfRequestIsValid(request: CreatePaymentSheetForPartnerRequest) {
    if (request.amount == null) {
        const message = 'The function must be called with amount';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.currency) {
        const message = 'The function must be called with currency';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.description) {
        const message = 'The function must be called with description';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
