import * as functions from 'firebase-functions';
import { stripeCustomers } from '../../constants/collections';
import { apiVersion } from '../../constants/stripe-constants';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { stripe } from '../../modules/stripe-module';
import { StripeCustomer } from '../../models/stripe-customer';
import { tryGetConnectedAccountData } from '../../firestore-functions/get-data/get-connected-account-data';
import { CreatePaymentSheetForUserRequest } from './create-payment-sheet-for-user-request';
import { CreatePaymentSheetForUserResponse } from './create-payment-sheet-for-user-response';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';

export async function createPaymentSheetForUser(
    data: CreatePaymentSheetForUserRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForUserResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const amount = data?.amount;
    const transferGroupId = data?.transferGroupId;
    const description = data?.description;
    const currency = data?.currency;
    const partnerId = data?.partnerId;
    const customerId = await getStripeCustomerId(context);
    const userEmail = context.auth!.token.email!;

    const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: apiVersion }
    );

    if (!ephemeralKey.secret) {
        const message = 'Error creating ephemeral key';
        throw new functions.https.HttpsError('internal', message);
    }

    const paymentMethodTypes = getPaymentMethodTypes(currency);
    const connectedAccount = await tryGetConnectedAccountData(partnerId);
    const paymentIntentAmount = getPaymentIntentAmount(amount);

    const paymentIntent = await stripe.paymentIntents.create({
        currency,
        description,
        amount: paymentIntentAmount,
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        receipt_email: userEmail,
        transfer_group: transferGroupId,
        on_behalf_of: connectedAccount.connectedAccountId,
    });

    if (!paymentIntent.client_secret) {
        const message = 'Error creating payment intent';
        throw new functions.https.HttpsError('internal', message);
    }

    return {
        customerId,
        paymentIntentSecret: paymentIntent.client_secret,
        ephemeralKeySecret: ephemeralKey.secret,
        paymentIntentId: paymentIntent.id,
    };
}

async function getStripeCustomerId(context: functions.https.CallableContext): Promise<string> {
    const customer = await firestoreDatabase()
        .collection(stripeCustomers)
        .doc(context.auth!.uid)
        .get();

    return (customer.data() as StripeCustomer).customerId;
}

function getPaymentMethodTypes(currency: string) {
    if (currency.toUpperCase() == 'PLN' || currency.toUpperCase() == 'EUR') {
        return ['card', 'p24'];
    }

    return ['card'];
}

function getPaymentIntentAmount(amount: number) {
    // TODO - add currency support
    return amount * 100;
}

function checkIfRequestIsValid(request: CreatePaymentSheetForUserRequest) {
    if (!request.amount) {
        const message = 'The function must be called with amount';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.transferGroupId) {
        const message = 'The function must be called with transfer group id';
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

    if (!request.partnerId) {
        const message = 'The function must be called with partner id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
