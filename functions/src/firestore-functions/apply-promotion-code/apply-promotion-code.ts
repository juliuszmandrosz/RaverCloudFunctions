import * as functions from "firebase-functions";
import {promotionCodes, users} from "../../constants/collections";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {ApplyPromotionCodeRequest} from "./apply-promotion-code-request";
import {PromotionCode} from "../../models/promotion-code";
import {throwExpiredPromotionCodeError} from "../../errors/throw-expired-promotion-code-error";
import {throwInvalidPromotionCodeError} from "../../errors/throw-invalid-promotion-code-error";

export async function applyPromotionCode(
    data: ApplyPromotionCodeRequest
): Promise<PromotionCode> {
    const promotionCode = data?.promotionCode;
    const userId = data?.userId;

    if (!promotionCode) {
        const message = 'The function must be called with promotion code.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!userId) {
        const message = 'The function must be called with user id.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    return firestoreDatabase().runTransaction(async (t) => {
        const promotionCodeRef = firestoreDatabase()
            .collection(users)
            .doc(userId)
            .collection(promotionCodes)
            .doc(promotionCode);

        const doc = await t.get(promotionCodeRef);

        if (!doc.exists) {
            throwInvalidPromotionCodeError();
        }

        const code = doc.data() as PromotionCode;

        if (!code.isValid) {
            throwExpiredPromotionCodeError();
        }


        const currentRedemptions = code.timesRedeemed + 1;
        const isStillValid = currentRedemptions < code.maxRedemptions;

        t.update(
            promotionCodeRef, {
                timesRedeemed: currentRedemptions,
                isValid: isStillValid
            } as PromotionCode
        );

        return code;
    });
}