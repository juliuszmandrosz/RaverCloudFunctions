export interface PostponeEventRequest {
    eventId: string;
    newEventStartTimestamp: number;
    newEventEndTimestamp: number;
}
