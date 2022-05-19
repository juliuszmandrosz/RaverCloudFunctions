import {throwInvalidAccessCodeError} from '../../errors/throw-invalid-access-code-error';
import {firestoreDatabase} from '../../modules/firebase-admin-module';
import {selectorsAccessCodes} from '../../constants/collections';
import {PartnerAccessCode} from "../../models/partner-access-code";

export async function tryGetPartnerAccessCodeData(accessCode: string) {
    const codeDoc = await getPartnerAccessCodeDocRef(accessCode).get();

    if (!codeDoc.exists) {
        throwInvalidAccessCodeError();
    }

    const result = codeDoc.data() as PartnerAccessCode;
    result.code = accessCode;

    return result;
}

export function getPartnerAccessCodeDocRef(accessCode: string) {
    return firestoreDatabase().collection(selectorsAccessCodes).doc(accessCode);
}
