import * as functions from 'firebase-functions';
import { apiVersion } from '../../constants/stripe-constants';
import { stripe } from '../../modules/stripe-module';

/// Returns ephemeral key secret
export async function tryCreateEphemeralKey(customerId: string): Promise<string> {
    const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: apiVersion }
    );

    if (!ephemeralKey.secret) {
        const message = 'Error creating ephemeral key';
        throw new functions.https.HttpsError('internal', message);
    }

    return ephemeralKey.secret;
}
