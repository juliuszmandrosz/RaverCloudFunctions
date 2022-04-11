import * as functions from "firebase-functions";
import {AddSelectorRequest} from "./add-selector-request";
import {firebaseAuth, firestoreDatabase} from "../../../modules/firebase-admin-module";
import {partners, selectors} from "../../../constants/collections";
import {Selector} from "../../../models/selector";
import {setSelectorClaim} from "../../../auth-functions/set-claim/set-selector-claim";
import {Partner} from "../../../models/partner";


export async function addSelector(
    data: AddSelectorRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    const selectorEmail = data?.email;
    const selectorPassword = data?.password;

    if (!selectorEmail) {
        const message = 'The function must be called with selector email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!selectorPassword) {
        const message = 'The function must be called with selector password.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }


    const partnerId = context.auth.uid;
    const partnerDocRef = firestoreDatabase().collection(partners).doc(partnerId);
    const partnerDoc = await partnerDocRef.get();
    const clubId = (partnerDoc.data() as Partner).clubId;

    const selector = await firebaseAuth().createUser({
        email: selectorEmail,
        password: selectorPassword
    });

    await partnerDocRef.collection(selectors).doc(selector.uid).set({
            clubId,
            email: selectorEmail,
        } as Selector
    );

    await firestoreDatabase().collection(selectors).doc(selector.uid).set({
        clubId,
        partnerId,
        email: selectorEmail,
    } as Selector)

    await setSelectorClaim({email: selectorEmail});
}

