import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { UpdateInvoiceDataRequest } from './update-invoice-data-request';
import { stripe } from '../../modules/stripe-module';
import { getStripeCustomerIdFromContext } from '../../utils/stripe-utils/get-stripe-customer-id-from-context';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { StripeCustomer } from '../../models/stripe-customer';
import { getStripeCustomerDocRef } from '../../firestore-functions/get-stripe-customer-data/get-stripe-customer-data';
import { checkVAT, countries } from 'jsvat';

export async function updateInvoiceData(
    data: UpdateInvoiceDataRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    validateRequestData(data);

    const name = data?.name;
    const isCompany = data?.isCompany ?? false;
    const vatNumber = data?.vatNumber;
    const countryCode = data?.countryCode;
    const userId = context.auth?.uid!;

    const stripeCustomerId = await getStripeCustomerIdFromContext(context);

    await stripe.customers.update(stripeCustomerId, { name });

    if (!isCompany) {
        await getStripeCustomerDocRef(userId).update({
            name,
            vatNumber: '',
        } as StripeCustomer);

        return;
    }

    const vatNumberWithCountryCode = getVatNumberWithCountryCode(countryCode!, vatNumber!);

    await validateVatNumber(vatNumberWithCountryCode);

    const currentTaxIds = await stripe.customers.listTaxIds(stripeCustomerId);

    for (const tax of currentTaxIds.data) {
        await stripe.customers.deleteTaxId(stripeCustomerId, tax.id);
    }

    await stripe.customers.createTaxId(stripeCustomerId, {
        type: 'eu_vat',
        value: vatNumberWithCountryCode,
    });

    await getStripeCustomerDocRef(userId).update({
        name,
        vatNumber: vatNumberWithCountryCode,
    } as StripeCustomer);
}

async function validateVatNumber(vatNumberWithCountryCode: string) {
    const result = checkVAT(vatNumberWithCountryCode, countries);

    if (!result.isValid) {
        const message = 'Invalid vat number';
        const details: FunctionsErrorDetails = 'invalid-vat-number';
        throw new functions.https.HttpsError('invalid-argument', message, details);
    }
}

function getVatNumberWithCountryCode(countryCode: string, vatNumber: string) {
    return `${countryCode.toUpperCase()}${vatNumber}`;
}

function validateRequestData(data: UpdateInvoiceDataRequest) {
    if (!data.name) {
        const message = 'The function must be called with name';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (data.isCompany) {
        if (!data.vatNumber) {
            const message = 'The function must be called vat number';
            throw new functions.https.HttpsError('invalid-argument', message);
        }

        if (!data.countryCode) {
            const message = 'The function must be called country code';
            throw new functions.https.HttpsError('invalid-argument', message);
        }
    }
}
