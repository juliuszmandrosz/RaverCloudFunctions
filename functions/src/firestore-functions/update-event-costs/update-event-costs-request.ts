import * as functions from 'firebase-functions';

export interface UpdateEventCostsRequest {
    eventId: string;
    clubId: string;
    paymentSessionId: string;
    response: functions.Response;
}
