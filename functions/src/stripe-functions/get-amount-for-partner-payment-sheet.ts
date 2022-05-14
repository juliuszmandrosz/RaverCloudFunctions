import { tryGetEventCostsData } from '../firestore-functions/get-data/get-event-costs-data';

interface GetAmountForPartnerPaymentSheetParams {
    eventId: string;
    clubId: string;
}

interface GetAmountForPartnerPaymentSheetResponse {
    amount: number;
    currency: string;
}

/// Returns event costs after update
export async function getAmountForPartnerPaymentSheet({
    eventId,
    clubId,
}: GetAmountForPartnerPaymentSheetParams): Promise<GetAmountForPartnerPaymentSheetResponse> {
    const eventCosts = await tryGetEventCostsData(clubId, eventId);

    const balance = eventCosts.paymentProcessorFeeBalance - eventCosts.eventPostponeBalance;

    const amount = balance > 0 ? balance : 0;

    return {
        amount,
        currency: eventCosts.currency,
    };
}
