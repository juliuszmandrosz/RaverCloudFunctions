import * as functions from 'firebase-functions';
import { getPromotionCode } from '../../firestore-functions/get-promotion-code/get-promotion-code';
import { getUserFee } from '../../utils/stripe-utils/get-user-fee';

interface GetTicketPaymentSheetAmountParams {
    eventPrice: number;
    vipPrice: number;
    isVip: boolean;
    context: functions.https.CallableContext;
    promotionCode?: string;
}

export async function getTicketPaymentSheetAmount({
    eventPrice,
    vipPrice,
    isVip,
    context,
    promotionCode,
}: GetTicketPaymentSheetAmountParams) {
    if (promotionCode) {
        const result = await getPromotionCode(
            {
                promotionCode: promotionCode,
            },
            context
        );
        // TODO - add currency support for codes
        eventPrice -= result.amountOff;
    }

    if (isVip) {
        eventPrice += vipPrice;
    }

    const fee = await getUserFee(eventPrice);

    eventPrice += fee;

    return eventPrice;
}
