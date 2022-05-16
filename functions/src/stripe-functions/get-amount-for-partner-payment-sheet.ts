import { tryGetEventCostsData } from '../firestore-functions/get-data/get-event-costs-data';

interface GetAmountForPartnerPaymentSheetParams {
    eventId: string;
    clubId: string;
}

interface GetAmountForPartnerPaymentSheetResponse {
    amount: number;
    currency: string;
}

export async function getAmountForPartnerPaymentSheet({
    eventId,
    clubId,
}: GetAmountForPartnerPaymentSheetParams): Promise<GetAmountForPartnerPaymentSheetResponse> {
    const eventCosts = await tryGetEventCostsData(clubId, eventId);

    return {
        amount: eventCosts.paymentProcessorFeeBalance,
        currency: eventCosts.currency,
    };
}
