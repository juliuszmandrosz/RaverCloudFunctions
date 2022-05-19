import { SelectorAccessCode } from '../../models/selector-access-code';
import { throwInvalidAccessCodeError } from '../../errors/throw-invalid-access-code-error';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { selectorsAccessCodes } from '../../constants/collections';

export async function tryGetSelectorAccessCodeData(accessCode: string) {
    const codeDoc = await getSelectorAccessCodeDocRef(accessCode).get();

    if (!codeDoc.exists) {
        throwInvalidAccessCodeError();
    }

    const result = codeDoc.data() as SelectorAccessCode;
    result.code = accessCode;

    return result;
}

export function getSelectorAccessCodeDocRef(accessCode: string) {
    return firestoreDatabase().collection(selectorsAccessCodes).doc(accessCode);
}
