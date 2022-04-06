import * as functions from "firebase-functions";
import {promotionCodes, users} from "../../constants/collections";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {PromotionCode} from "../../models/promotion-code";
import {GetPromotionCodeRequest} from "./get-promotion-code-request";
import {throwInvalidPromotionCodeError} from "../../errors/throw-invalid-promotion-code-error";
import {throwExpiredPromotionCodeError} from "../../errors/throw-expired-promotion-code-error";

export async function getPromotionCode(
    data: GetPromotionCodeRequest,
    context: functions.https.CallableContext
): Promise<PromotionCode> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    const promotionCode = data?.promotionCode;

    if (!promotionCode) {
        const message = 'The function must be called with promotion code.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const doc = await firestoreDatabase()
        .collection(users)
        .doc(context.auth.uid)
        .collection(promotionCodes)
        .doc(promotionCode)
        .get();

    if (!doc.exists) {
        throwInvalidPromotionCodeError();
    }

    const code = doc.data() as PromotionCode;
    code.code = doc.id;

    if (!code.isValid) {
        throwExpiredPromotionCodeError();
    }

    return code;
}