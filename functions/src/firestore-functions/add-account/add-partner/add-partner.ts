import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../../errors/throw-unauthenticated-error';
import { firestoreDatabase } from '../../../modules/firebase-admin-module';
import { partners } from '../../../constants/collections';
import { setPartnerClaim } from '../../../auth-functions/set-claim/set-partner-claim';
import { Partner } from '../../../models/partner';
import { StripeConnectedAccount } from '../../../models/stripe-connected-account';
import { AddPartnerRequest } from './add-partner-request';
import {
    getPartnerAccessCodeDocRef,
    tryGetPartnerAccessCodeData,
} from '../../get-data/get-partner-access-code-data';
import { getConnectedAccountDocRef } from '../../get-data/get-connected-account-data';
import { getClubDocRef, tryGetClubData } from '../../get-data/get-club-data';
import { addStripeCustomer } from '../../../stripe-functions/add-stripe-customer/add-stripe-customer';

export async function addPartner(
    data: AddPartnerRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const partnerId = context.auth!.token.uid;
    const email = context.auth!.token.email!;
    const accessCode = data?.accessCode;

    if (!accessCode) {
        const message = 'The function must be called with access code';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const partnerDocRef = firestoreDatabase().collection(partners).doc(partnerId);
    const partnerDoc = await partnerDocRef.get();

    if (partnerDoc.exists) {
        const message = 'Partner with given id already exists';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await setPartnerClaim({ email });

    await usePartnerAccessCode(accessCode, partnerId);

    await partnerDocRef.set({ email } as Partner);

    await addStripeCustomer({ userId: partnerId, userEmail: email });
}

async function usePartnerAccessCode(accessCode: string, partnerId: string) {
    const accessCodeData = await tryGetPartnerAccessCodeData(accessCode);

    await removeAccessCode(accessCode);

    await addConnectedAccountToFirestore(partnerId, accessCodeData.connectedAccountId);

    await addRegisteredClub(accessCodeData.clubId, partnerId);

    await removeExistingClub(accessCodeData.clubId);

    return accessCodeData;
}

async function addConnectedAccountToFirestore(partnerId: string, connectedAccountId: string) {
    await getConnectedAccountDocRef(partnerId).set({
        connectedAccountId: connectedAccountId,
    } as StripeConnectedAccount);
}

async function addRegisteredClub(currentClubId: string, partnerId: string) {
    let clubData = await tryGetClubData(currentClubId);
    clubData.isRegistered = true;

    await getClubDocRef(partnerId).set(clubData);
}

async function removeExistingClub(clubId: string) {
    const clubDocRef = getClubDocRef(clubId);
    await clubDocRef.delete();
}

async function removeAccessCode(accessCode: string) {
    await getPartnerAccessCodeDocRef(accessCode).delete();
}
