import * as functions from 'firebase-functions';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import * as randomstring from 'randomstring';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { SelectorAccessCode } from '../../models/selector-access-code';
import * as moment from 'moment';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { selectorsAccessCodes } from '../../constants/collections';
import { tryGetPartnerData } from '../get-data/get-partner-data';

export async function generateAccessCodeForSelector(
    data: any,
    context: functions.https.CallableContext
): Promise<string> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    await checkPartnerClaim({ email: context.auth.token.email! });

    const partnerId = context.auth.uid;

    const partner = await tryGetPartnerData(partnerId);

    const code = await generateCode();

    // TODO - add cloud task with delete after merge https://github.com/juliuszmandrosz/RaverCloudFunctions/pull/12
    const expirationDateTime = Timestamp.fromDate(moment().add(1, 'day').toDate());

    await firestoreDatabase()
        .collection(selectorsAccessCodes)
        .doc(code)
        .set({ clubId: partner.clubId, expirationDateTime } as SelectorAccessCode);

    return code;
}

async function generateCode(): Promise<string> {
    let isCodeUnique = false;
    let code = '';

    while (!isCodeUnique) {
        code = randomstring.generate(6);

        isCodeUnique = await firestoreDatabase()
            .collection(selectorsAccessCodes)
            .doc(code)
            .get()
            .then((doc) => !doc.exists);
    }

    return code;
}
