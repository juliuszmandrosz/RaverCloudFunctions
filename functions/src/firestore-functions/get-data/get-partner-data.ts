import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { partners } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { Partner } from '../../models/partner';

const errorMessage = 'Partner with given id does not exists.';

export async function tryGetPartnerData(partnerId: string) {
    const partnerDoc = await getPartnerDocRef(partnerId).get();

    if (!partnerDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    const result = partnerDoc.data() as Partner;
    result.id = partnerId;

    return result;
}

export function getPartnerDocRef(partnerId: string) {
    return firestoreDatabase().collection(partners).doc(partnerId);
}
