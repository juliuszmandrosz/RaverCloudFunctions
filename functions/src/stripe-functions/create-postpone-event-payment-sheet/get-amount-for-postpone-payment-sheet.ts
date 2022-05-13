import { tryGetEventCostsData } from '../../firestore-functions/get-data/get-event-costs-data';

interface GetAmountForPostponePaymentSheetParams {
    eventId: string;
    clubId: string;
}

interface GetAmountForPostponePaymentSheetResponse {
    amount: number;
    currency: string;
}

/// Returns event costs after update
export async function getAmountForPostponePaymentSheet({
    eventId,
    clubId,
}: GetAmountForPostponePaymentSheetParams): Promise<GetAmountForPostponePaymentSheetResponse> {
    const eventCosts = await tryGetEventCostsData(clubId, eventId);

    const balance = eventCosts.paymentProcessorFeeBalance - eventCosts.eventPostponeBalance;

    const amount = balance > 0 ? balance : 0;

    return {
        amount,
        currency: eventCosts.currency,
    };
}
